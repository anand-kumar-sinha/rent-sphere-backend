const User = require("../models/User");
const generateToken = require("../middleware/generateToken");
const { oauth2client } = require("../config/googleConfig");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const Product = require("../models/Product");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "helloengg.420@gmail.com",
    pass: "htqj ezbm cdfb jiim",
  },
});

const getProducts = async (req, res) => {
  try {
    const { lat, lon, page, range, category, minPrice, maxPrice } = req.query;
    const radius = parseInt(range) * 1000;
    const limit = 15;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters = {};
    if (category) filters.category = category;

    if (minPrice || maxPrice) {
      filters.pricePerDay = {};
      if (minPrice) filters.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) filters.pricePerDay.$lte = parseFloat(maxPrice);
    }
    if (lat && lon) {
      const products = await Product.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(lat), parseFloat(lon)],
            },
            distanceField: "distance",
            maxDistance: radius,
            spherical: true,
          },
        },
        { $match: filters },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
        },
        {
          $unwind: "$owner",
        },
      ]);

      const totalCount = await Product.countDocuments({
        location: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(lat), parseFloat(lon)],
              parseInt(range) / 6378.1,
            ],
          },
        },
        ...filters,
      });

      res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
        products,
      });

      return;
    } else {
      const products = await Product.aggregate([
        { $match: filters },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
        },
        {
          $unwind: "$owner",
        },
      ]);

      totalCount = await Product.countDocuments(filters);

      res.json({
        success: true,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
        products,
      });

      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
