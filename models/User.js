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
    type: String, 
    default: "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?t=st=1732461238~exp=1732464838~hmac=c5526687db2dbb14683397ad1940f6d9c05e7b7b442683e0d778d5645e7c9e72&w=740",
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
