const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
    },
    mobileNo: {
      type: String,
      required: [true, "Mobile is required"],
      trim: true,
    },
    amount: {
      type: String,
      required: [true, "Amount is required"],
    },
    orderDate: {
      type: Date,
      default: Date.now,
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

orderSchema.index({ location: "2dsphere" });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
