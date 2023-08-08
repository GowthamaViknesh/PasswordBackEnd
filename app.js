const express = require('express');
const app = express();
const mongo = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const link = 'mongodb+srv://Password:Pass@cluster0.tiscrk5.mongodb.net/';
const JWT_SECRET = 'gsdjhkdfjkhdsfsdkfjdfnbmndcv';

app.set('view engine', 'ejs');
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

mongo
  .connect(link)
  .then(() => {
    console.log('Database is Connected');
  })
  .catch((error) => console.log(error));

app.listen(5000, () => {
  console.log('server is started');
});

require('./Schema/userDeatils');
const user = mongo.model('UserInfo');

app.post('/register', async (req, res) => {
  const { email, pass } = req.body;
  const encryptPass = await bcrypt.hash(pass, 10);
  try {
    const olduser = await user.findOne({ email });
    if (olduser) {
      return res.send({ error: 'User Exits' });
    }
    await user.create({
      email,
      pass: encryptPass,
    });
    res.send({ status: 'ok' });
  } catch (error) {
    res.send({ status: 'error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, pass } = req.body;
  const User = await user.findOne({ email });
  if (!User) {
    return res.json({ error: 'User Not Found' });
  } else {
    if (await bcrypt.compare(pass, User.pass)) {
      const token = jwt.sign({ email }, JWT_SECRET, {
        expiresIn: 10,
      });
      if (res.status(201)) {
        res.json({ status: 'ok', data: token });
      } else {
        res.json({ status: 'error' });
      }
    }
  }
});

app.post('/userData', async (req, res) => {
  const { token } = req.body;
  try {
    const users = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return 'Token Expired';
      }
      return res;
    });
    console.log(users);
    if (users == 'Token Expired') {
      return res.send({ status: 'error', data: 'Token Expired' });
    }
    const useremail = users.email;
    user
      .findOne({ email: useremail })
      .then((data) => {
        res.send({ status: 'ok', data: data });
      })
      .catch((error) => {
        res.send({ status: 'error', data: error });
      });
  } catch (error) {}
});

app.post('/forgotPass', async (req, res) => {
  const { email } = req.body;
  try {
    const olduser = await user.findOne({ email });
    if (!olduser) {
      res.send({ status: 'User Not Exists' });
    }
    const secret = JWT_SECRET + olduser.pass;
    const token = jwt.sign({ email: olduser.email, id: olduser.id }, secret, {
      expiresIn: '5m',
    });
    const link = `http://localhost:5000/reset-pass/${olduser.id}/${token}`;
    console.log(link);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'gowthamviknesh588@gmail.com',
        pass: 'tjhnjpcajedjuirk',
      },
    });

    var mailOptions = {
      from: 'gowthamviknesh588@gmail.com',
      to: 'gowthampostbox18@gmail.com',
      subject: 'Password Rest Link',
      html: `<a href="${link}">${link}</a>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (error) {
    res.send({ error: 'Something went wrong' });
  }
});

app.get('/reset-pass/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const olduser = await user.findOne({ _id: id });
  if (!olduser) {
    res.send({ status: 'User Not Exits' });
  }
  const secret = JWT_SECRET + olduser.pass;
  try {
    const verify = jwt.verify(token, secret);
    res.render('index', { email: verify.email, status: 'Not Verified' });
  } catch (error) {
    res.send('Not Verified');
  }
});

app.post('/reset-pass/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  const { pass } = req.body;

  const olduser = await user.findOne({ _id: id });
  if (!olduser) {
    res.json({ status: 'User Not Exits' });
  } else {
    const secret = JWT_SECRET + olduser.pass;
    try {
      const verify = jwt.verify(token, secret);

      const encryptPassword = await bcrypt.hash(pass, 10);
      await user.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            pass: encryptPassword,
          },
        }
      );

      res.render('index', { email: verify.email, status: 'Verified' });
    } catch (error) {
      res.send({ status: 'Something Not Right' });
    }
  }
});
