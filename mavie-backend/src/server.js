const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MaVie backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MaVie Backend",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MaVie backend server running on port ${PORT}`);
});