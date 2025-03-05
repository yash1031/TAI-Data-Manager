require("dotenv").config(); // Load environment variables
const express = require("express"); // Web framework for Node.js
const multer = require("multer"); // Middleware for handling multipart/form-data
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); // AWS SDK v3
const ID3 = require("node-id3");
const fs = require("fs");
const path = require("path"); // Handles file paths
const cors = require("cors");
const crypto = require("crypto"); // For generating unique file names

const app = express();
app.use(cors());

// AWS S3 Configuration (v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log("S3 Client Initialized:", s3);

// Multer Storage Configuration (Manually Handling Upload)
const storage = multer.memoryStorage(); // Store file in memory before upload

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "audio/mpeg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPG, PNG, and MP3 are allowed."), false);
    }
    cb(null, true);
  },
});

// Upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  try {
    // Generate a unique file name
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;

    // Upload file to S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    // Construct file URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    res.json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Start Server
app.listen(5001, () => console.log("Server running on port 5001"));
