const multer = require("multer");

// Use memory storage instead of disk
const storage = multer.memoryStorage();

const upload = multer({ storage });

// Middleware for multiple file uploads (max 10 files)
const uploadMiddleware = upload.array("files", 10);

module.exports = uploadMiddleware;

