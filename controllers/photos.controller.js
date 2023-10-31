const Photo = require('../models/photo.model');
const htmlEscape = require('../utils/htmlEscape');
const Voter = require('../models/Voter.model')

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) { // if fields are not empty...
      if (title.length > 25 || author.length > 50) {
        throw new Error('Wrong input!')
      }

      const escapedTitle = htmlEscape(title);
      const escapedAuthor = htmlEscape(author);
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailPattern.test(email)) {
        throw new Error('Wrong input!')
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {
        const newPhoto = new Photo({ title: escapedTitle, author: escapedAuthor, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);

      } else {
        throw new Error('Wrong input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const ipAddress = req.socket.remoteAddress;
      const alreadyVoted = await Voter.findOne({ user: ipAddress, votes: { $in: [req.params.id] } });

      if (!alreadyVoted) {
        photoToUpdate.votes++;
        await photoToUpdate.save();

        const newVoter = new Voter({ user: ipAddress, votes: [req.params.id] });
        await newVoter.save();
        res.send({ message: 'OK' });
      } else {
        res.status(500).json({ message: 'Vote invalid' })
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
