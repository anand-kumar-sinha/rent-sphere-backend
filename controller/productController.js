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

const addProduct = async (req, res) => {
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
    const { title, description, category, pricePerDay, location, images } =
      req.body;

    if (
      !title ||
      !description ||
      !category ||
      !pricePerDay ||
      !location ||
      !images
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
    });

    res.status(201).json({
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

const getProducts = async (req, res) => {
  try {
    const { lat, lon, page, range, category, minPrice, maxPrice } = req.query;
    const radius = parseInt(range) * 1000;
    const limit = 5;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters = {};
    if (category) filters.category = category;

    if (minPrice || maxPrice) {
      filters.pricePerDay = {};
      if (minPrice) filters.pricePerDay.$gte = parseFloat(minPrice); // Greater than or equal to minPrice
      if (maxPrice) filters.pricePerDay.$lte = parseFloat(maxPrice); // Less than or equal to maxPrice
    }

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
    const product = await Product.findById(id).populate("owner");
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

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

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

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

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
}

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
