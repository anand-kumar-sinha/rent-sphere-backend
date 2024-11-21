const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics",
        "Tools",
        "Outdoor",
        "Vehicles",
        "Fashion",
        "Home Appliances",
        "Sports Equipment",
        "Furniture",
        "Books",
        "Toys & Games",
        "Art & Collectibles",
        "Music Instruments",
        "Office Equipment",
        "Kitchenware",
        "Party Supplies",
        "Luggage & Bags",
        "Pets & Animals",
        "Others",
      ],
    },
    pricePerDay: {
      type: Number,
      required: [true, "Price per day is required"],
      min: [0, "Price must be positive"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON format
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    images: {
      type: [String], // Array of image URLs
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "At least one image is required",
      },
    },
    availability: {
      type: Boolean,
      default: true, // Indicates if the item is available for rent
    },
    rentalTerms: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

productSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
