const User = require("../models/User");
const generateToken = require("../middleware/generateToken");
const { oauth2client } = require("../config/googleConfig");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const Product = require("../models/Product");
const { json } = require("express");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "helloengg.420@gmail.com",
    pass: "htqj ezbm cdfb jiim",
  },
});

const sellerFetchProduct = async (req, res) => {
  try {
    let user = req.user;
    let page = 1;
    let limit = 15;
    let skip = (page - 1) * limit;
    if (!user) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!user.isSeller) {
      res.status(403).json({
        success: false,
        message: "You are not seller please contact admin",
      });
      return;
    }

    const products = await Product.find({ owner: user._id })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const count = await Product.countDocuments({ owner: user._id });

    if (!products) {
      res.status(404).json({
        success: false,
        message: "No products found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const selleraddProduct = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if (!user.isSeller) {
      res.status(403).json({
        success: false,
        message: "You are not a seller",
      });
      return;
    }
    const {
      title,
      description,
      category,
      pricePerDay,
      location,
      images,
      availability,
      rentalTerms
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !pricePerDay ||
      !location ||
      !images ||
      !rentalTerms
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    const product = await Product.create({
      owner: user._id,
      title,
      description,
      category,
      pricePerDay,
      location,
      images,
      availability,
      rentalTerms,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const sellerupdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    if(!user){
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if(!user?.isSeller){
      res.status(403).json({
        success: false,
        message: "You are not seller please contact admin",
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    let product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (user._id.toString() !== product.owner.toString()) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const sellerdeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if(!user){
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if(!user?.isSeller){
      res.status(403).json({
        success: false,
        message: "You are not seller please contact admin",
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    let product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (user._id.toString() !== product.owner.toString()) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    product = await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

module.exports = {
  sellerFetchProduct,
  selleraddProduct,
  sellerupdateProduct,
  sellerdeleteProduct
};
