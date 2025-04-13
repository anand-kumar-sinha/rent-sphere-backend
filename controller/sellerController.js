const nodemailer = require("nodemailer");
const Product = require("../models/Product");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../firebase");
const fs = require("fs");
const User = require("../models/User");
const Order = require("../models/Orders");

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

const sellerFetchOrder = async (req, res) => {
  try {
    let user = req.user;
    let { page } = req.query;
    page = parseInt(page);
    let limit = 8;
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

    const { reciveOrders } = await User.findById(user._id).populate({
      path: "reciveOrders",
      options: {
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
      populate: {
        path: "productId",
      },
    });

    let count = user.reciveOrders.length;

    if (!reciveOrders) {
      res.status(404).json({
        success: false,
        message: "No orders found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count,
      reciveOrders,
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

    // Check if user is authenticated
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Check if user is a seller
    if (!user.isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not a seller",
      });
    }

    // Extract body fields
    const {
      title,
      description,
      category,
      pricePerDay,
      location,
      availability,
      rentalTerms,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !pricePerDay ||
      !location ||
      !rentalTerms
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Parse location (if sent as JSON string)
    const parsedLocation = JSON.parse(location);

    // Validate file upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    // Upload images to Firebase Storage
    const imagePaths = await Promise.all(
      req.files.map(async (file) => {
        const uniquePath = `rentsphere/${user._id}/${Date.now()}-${file.originalname}`;
        const storageRef = ref(storage, uniquePath);

        const snapshot = await uploadBytes(storageRef, file.buffer, {
          contentType: file.mimetype,
        });

        return await getDownloadURL(snapshot.ref);
      })
    );

    // Create product document
    const product = await Product.create({
      owner: user._id,
      title,
      description,
      category,
      pricePerDay,
      location: parsedLocation,
      images: imagePaths,
      availability,
      rentalTerms,
    });

    // Push product to user's listings
    user.listings.push(product._id);
    await user.save();

    // Send response
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the product",
      error: error.message || error,
    });
  }
};

const sellerupdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    if (!user) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if (!user?.isSeller) {
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

    if (!user) {
      res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    if (!user?.isSeller) {
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

const sellerDahsboard = async (req, res) => {
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
        message: "You are not seller please contact admin",
      });
      return;
    }

    const totalProducts = await user.listings.length;
    const totalOrders = await user.reciveOrders.length;
    let totalRevenue = 0;

    for (const orderId of user.reciveOrders) {
      const order = await Order.findById(orderId);
      totalRevenue += parseInt(order.amount, 10);
    }

    res.status(200).json({
      success: true,
      totalProducts,
      totalOrders,
      totalRevenue,
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
  sellerdeleteProduct,
  sellerFetchOrder,
  sellerDahsboard,
};
