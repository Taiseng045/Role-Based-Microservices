require("dotenv").config();

const express = require("express");
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

  if (req.headers["x-user-role"] !== "user") {
    return res.status(403).json({
      message: "User access required."
    });
  }

  next();
});

// View own profile
app.get("/user/viewprofile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    return res.status(200).json({
      user
    });
  } catch (error) {
    return res.status(500).json({
      message: "Cannot retrieve profile.",
      error: error.message
    });
  }
});

// Update own profile
app.put("/user/updateprofile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { name, phone } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: "Profile update failed.",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});