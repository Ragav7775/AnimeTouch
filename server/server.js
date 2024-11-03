// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const mongoose = require('mongoose');
// const speakeasy = require('speakeasy');
// const nodemailer = require('nodemailer');

// const app = express();
// const PORT = process.env.PORT || 5500;

// // Connect to MongoDB Atlas
// const mongoUri = process.env.MONGODB_URI;
// if (!mongoUri) {
//   throw new Error("MONGODB_URI environment variable not set");
// }

// mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('Connected to MongoDB Atlas');
//   })
//   .catch((error) => {
//     console.error('Error connecting to MongoDB Atlas:', error);
//   });


// const userSchema = new mongoose.Schema({
//   username: { type: String, unique: true, required: true },
//   email: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   otp: String,
//   otpExpiry: Date,
// });

// const User = mongoose.model('User', userSchema);

// app.use(cors({
//   origin: 'https://animetouch.vercel.app',  // client URL
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));


// app.use(bodyParser.json());


// // Generate OTP
// const generateOTP = () => {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   console.log('Generated OTP:', otp);
//   return otp
// };

// // Send OTP via email
// const sendOTPEmail = (email, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     host: 'smtp.gmail.com',
//     port: 465, // or 465 if you're using SSL
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is ${otp}`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error('Error sending OTP email:', error);
//       return; // Make sure it doesn't proceed when there's an error
//     }
//     console.log('OTP email sent:', info.response);
//   });
// };



// app.post('/api/signup', async (req, res) => {
//   const { username, email, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.json({ success: false, message: 'Username already taken' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ username, email, password: hashedPassword });
//     await newUser.save();

//     res.json({ success: true, message: 'Signup Successful' });
//   } catch (error) {
//     console.error('Error in signup:', error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });


// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Check if user exists
//     const user = await User.findOne({ username });
//     if (user) {

//       // Verify password
//       const match = await bcrypt.compare(password, user.password);
//       if (match) {

//         // Generate OTP, save it in the user document, and send it via email
//         const otp = generateOTP();
//         user.otp = otp;
//         user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
//         await user.save();
//         sendOTPEmail(user.email, otp);
//       } else {
//         return res.json({ success: false, message: 'Invalid password' });
//       }

//       res.json({ success: true, message: 'OTP sent to your email' });
//     } else {
//       return res.json({ success: false, message: 'Invalid username' });
//     }
//   } catch (error) {
//     console.error('Error in login:', error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });


// app.post('/api/verify-otp', async (req, res) => {
//   const { username, otp } = req.body;

//   try {
//     const user = await User.findOne({ username });
//     if (user) {
//       const isValidOtp = speakeasy.totp.verify({
//         secret: process.env.OTP_SECRET || 'supersecret',
//         encoding: 'base32',
//         token: otp,
//         window: 1,
//       });

//       // Check if OTP is valid and not expired
//       if (isValidOtp && Date.now() < user.otpExpiry) {
//         user.otp = null; // Clear OTP after successful verification
//         user.otpExpiry = null;
//         await user.save();

//         return res.json({ success: true });
//       } else {
//         return res.json({ success: false, message: 'Invalid or expired OTP' });
//       }
//     } else {
//       return res.json({ success: false, message: 'Invalid username' });
//     }
//   } catch (error) {
//     console.error('Error in OTP verification:', error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });


// // Endpoint to check if the server is running
// app.get('/api/status', (req, res) => {
//   res.json({ status: 'Server is Running' });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });









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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    console.log("Found user:", user);

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      console.log("Password match:", match);
      if (match) {
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();
        await sendOTPEmail(user.email, otp);
      } else {
        return res.json({ success: false, message: 'Invalid password' });
      }
      res.json({ success: true, message: 'OTP sent to your email' });
    } else {
      return res.json({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


app.post('/api/verify-otp', async (req, res) => {
  const { username, otp } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      if (user.otp === otp && Date.now() < user.otpExpiry) {
        user.otp = null; // Clear OTP after successful verification
        user.otpExpiry = null;
        await user.save();

        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: 'Invalid or expired OTP' });
      }
    } else {
      return res.json({ success: false, message: 'Invalid username' });
    }
  } catch (error) {
    console.error('Error in OTP verification:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is Running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});