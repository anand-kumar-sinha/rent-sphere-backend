const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false,
  },
  otp: {
    type: String,
    select: false,
  },
  fcmId:{
    type: String,
  },
  username: {
    type: String,
    required: [true, "Please enter your username"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
  },
  profilePicture: {
    type: String, // URL of the profile picture
    default: null,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSeller: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  listings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item", // Reference to the Item model
    },
  ],
  rentals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental", // Reference to the Rental model
    },
  ],
});

// Geospatial index for location field
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
