import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");

  // Handle multiple file selection
  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  // Upload multiple files to backend
  const handleUpload = async () => {
    if (!files.length) {
      alert("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file); // "files" should match backend multer config
    });

    try {
      setUploadStatus("Uploading files...");
      const res = await axios.post("http://localhost:5001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus(`Files uploaded! URLs: ${res.data.fileUrls.join(", ")}`);
    } catch (error) {
      console.log(error);
      setUploadStatus("Upload failed. Please try again.");
    }
  };

  return (
    <div>
      <h2>Upload MP3 or Images</h2>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{uploadStatus}</p>
    </div>
  );
};

export default FileUpload;
