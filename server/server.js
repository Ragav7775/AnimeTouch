require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

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
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://animetouch.vercel.app',  // Your client URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: 'Signup Successful' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: 'Password Invalid' });
      }
    } else {
      return res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Endpoint to check if the server is running
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is Running' });
});

app.listen(PORT, () => {
  console.log(`Server is Running on Port ${PORT}`);
});
