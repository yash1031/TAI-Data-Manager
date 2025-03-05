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

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log("S3 Client Initialized:", s3);

// Multer Storage Configuration (Memory Storage)
const storage = multer.memoryStorage();

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

// Upload Route for Multiple Files
app.post("/upload", upload.array("files", 5), async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }
  
    try {
      console.log(`Uploading ${req.files.length} files to S3`);
  
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          const fileExtension = path.extname(file.originalname);
          const fileName = `${crypto.randomUUID()}${fileExtension}`;
  
          console.log(`Uploading file: ${fileName}`);
  
          const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
  
          const command = new PutObjectCommand(uploadParams);
          await s3.send(command);
          
          console.log(`File uploaded successfully: ${fileName}`);
  
          return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        })
      );
  
      res.json({
        message: "Files uploaded successfully",
        fileUrls: uploadedFiles,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Failed to upload files", details: error.message });
    }
  });
  

// Start Server
app.listen(5001, () => console.log("Server running on port 5001"));