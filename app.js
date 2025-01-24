require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Initialize Express
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

// Define Mongoose Schema and Model
const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
});

const Image = mongoose.model("Image", imageSchema);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user-uploads", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

// Initialize Multer
const upload = multer({ storage });

// Route to render the upload form
app.get("/", (req, res) => {
  res.render("index", { message: null, imagePath: null });
});

// Handle image upload to Cloudinary without local storage
app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.render("index", { message: "Please upload an image!", imagePath: null });
  }
  try {
    const image = new Image({
      url: req.file.path,
      public_id: req.file.public_id || req.file.filename,
    });
    await image.save();
    res.render("error", { message: "Image uploaded successfully!", imagePath: req.file.path });
  } catch (err) {
    console.error("Upload Error: ", err);
    res.status(500).send("Error uploading image");
  }
});

// Admin panel to show uploaded images from MongoDB
app.get("/admin", async (req, res) => {
  try {
    const images = await Image.find();
    res.render("admin", { images });
  } catch (err) {
    console.error("Error fetching images: ", err);
    res.status(500).send("Error fetching images");
  }
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
