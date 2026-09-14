require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const connectDB = require("./dbConnect");
const User = require("./User");
const app = express();
connectDB();
app.use(cors());
app.use(express.json());

// Prevent direct access to this internal service
app.use((req, res, next) => {
  if (req.headers["x-internal-key"] !== process.env.SERVICE_SECRET) {
    return res.status(403).json({
      message: "Direct service access is forbidden."
    });
  }

  next();
});
app.post("/register/userregister", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must have at least 6 characters."
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: "user"
    });
    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Registration failed.",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Registration Service running on port ${PORT}`);
});