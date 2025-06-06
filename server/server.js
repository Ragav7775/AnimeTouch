require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5500;

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI environment variable not set");
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  otp: String,
  otpExpiry: Date,
});

const User = mongoose.model('User', userSchema);

app.use(cors({
  origin: 'https://animetouch.vercel.app',  // client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendOTPEmail = (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP email:', error);
      return;
    }
    console.log('OTP email sent:', info.response);
  });
};


app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (!existingUser && !existingEmail) {

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      res.json({ success: true, message: 'Signup Successful' });
    } else {
      return res.json({ success: false, message: 'Username or Email already taken' });
    }
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



app.post('/api/send-otp', async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
      sendOTPEmail(user.email, otp);
      await user.save();
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error in OTP generation:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password, otp } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match && user.otp === otp && Date.now() < user.otpExpiry) {
        user.otp = null; // Clear OTP after successful verification
        user.otpExpiry = null;
        await user.save();
        res.json({ success: true, message: 'Login successful' });
      } else {
        res.json({ success: false, message: 'OTP has been sent to your registered email.' });
      }
    } else {
      res.json({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});





app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is Running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});