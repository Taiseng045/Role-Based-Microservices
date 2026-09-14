require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const connectDB = require("./dbConnect");
const User = require("./User");
const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.headers["x-internal-key"] !== process.env.SERVICE_SECRET) {
    return res.status(403).json({
      message: "Direct service access is forbidden."
    });
  }
  next();
});
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required."
      });
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be admin or user."
      });
    }
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email, password or role."
      });
    }
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );
    if (!passwordMatches || user.role !== role) {
      return res.status(401).json({
        message: "Invalid email, password or role."
      });
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );
    return res.status(200).json({
      message: "Login successful.",
      role: user.role,
      token
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed.",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Login Service running on port ${PORT}`);
});