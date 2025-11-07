const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRouter = require("./routes/auth");
const cvAnalyzerRouter = require("./cv-analyzer/cvAnalyzer");
const serverRouter = require("./routes/server");

// Load .env file from server directory or root directory
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const port = process.env.VITE_PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection (optional - only connect if URI is provided)
const uri = process.env.VITE_MONGODB_URI;
if (uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
  mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("MongoDB database connection established successfully");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      console.log(
        "Server will continue without MongoDB. Auth features will be disabled.",
      );
    });
} else {
  console.log(
    "MongoDB URI not configured. Server running without database. Auth features disabled.",
  );
}

app.use("/auth", authRouter);
app.use("/cv-analyzer", cvAnalyzerRouter);
app.use("/server", serverRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
