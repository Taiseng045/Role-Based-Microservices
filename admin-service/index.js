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
  if (req.headers["x-user-role"] !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }
  next();
});
// Search by name or email
app.get("/admin/searchuser", async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) {
      return res.status(400).json({
        message: "Provide a name or email to search."
      });
    }
    const users = await User.find({
      role: "user",
      $or: [
        {
          name: {
            $regex: search,
            $options: "i"
          }
        },
        {
          email: {
            $regex: search,
            $options: "i"
          }
        }
      ]
    }).select("-password");

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: "Search failed.",
      error: error.message
    });
  }
});
// View all ordinary users
app.get("/admin/viewalluser", async (req, res) => {
  try {
    const users = await User.find({
      role: "user"
    }).select("-password");

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      message: "Cannot retrieve users.",
      error: error.message
    });
  }
});
// Delete an ordinary user using email
app.delete("/admin/deluser", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required."
      });
    }

    const deletedUser = await User.findOneAndDelete({
      email: email.toLowerCase().trim(),
      role: "user"
    });

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.status(200).json({
      message: "User deleted successfully.",
      deletedEmail: deletedUser.email
    });
  } catch (error) {
    return res.status(500).json({
      message: "Delete failed.",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});