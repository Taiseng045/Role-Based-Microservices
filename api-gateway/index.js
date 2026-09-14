require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const {
  authenticateToken,
  allowRole
} = require("./authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// const forwardRequest = async (req, res, serviceURL) => {
//   try {
//     const response = await axios({
//       method: req.method,
//       url: `${serviceURL}${req.originalUrl}`,
//       params: req.query,
//       data: req.body,
//       headers: {
//         "x-internal-key": process.env.SERVICE_SECRET,
//         "x-user-id": req.user?.userId || "",
//         "x-user-role": req.user?.role || ""
//       }
//     });

//     return res.status(response.status).json(response.data);
//   } catch (error) {
//     const status = error.response?.status || 500;

//     const responseData = error.response?.data || {
//       message: "Internal microservice is unavailable."
//     };

//     return res.status(status).json(responseData);
//   }
// };\
const forwardRequest = async (req, res, serviceURL) => {
  try {
    // Keep the complete route but remove its query string.
    const routePath = req.originalUrl.split("?")[0];

    const response = await axios({
      method: req.method,
      url: `${serviceURL}${routePath}`,
      params: req.query,
      data: req.body,
      headers: {
        "x-internal-key": process.env.SERVICE_SECRET,
        "x-user-id": req.user?.userId || "",
        "x-user-role": req.user?.role || ""
      }
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;

    const responseData = error.response?.data || {
      message: "Internal microservice is unavailable."
    };

    return res.status(status).json(responseData);
  }
};

// Public registration route
app.post("/register/userregister", (req, res) => {
  forwardRequest(req, res, process.env.REGISTER_SERVICE_URL);
});

// Public login route
app.post("/auth/login", (req, res) => {
  forwardRequest(req, res, process.env.LOGIN_SERVICE_URL);
});

// Admin-only routes
app.use(
  "/admin",
  authenticateToken,
  allowRole("admin"),
  (req, res) => {
    forwardRequest(req, res, process.env.ADMIN_SERVICE_URL);
  }
);

// User-only routes
app.use(
  "/user",
  authenticateToken,
  allowRole("user"),
  (req, res) => {
    forwardRequest(req, res, process.env.USER_SERVICE_URL);
  }
);

app.get("/", (req, res) => {
  res.json({
    message: "University API Gateway is running"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});