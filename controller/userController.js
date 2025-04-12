const User = require("../models/User");
const generateToken = require("../middleware/generateToken");
const { oauth2client } = require("../config/googleConfig");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const Product = require("../models/Product");
const Order = require("../models/Orders");
const { messaging } = require("../firebase");
const sendNotificationToDevice = require("../middleware/sendNotification");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "helloengg.420@gmail.com",
    pass: "htqj ezbm cdfb jiim",
  },
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password, fcmId } = req.body;

    if (!name || !email || !password) {
      res.status(401).json({
        success: false,
        message: "Please enter all required fields",
      });
      return;
    }
    const existingUser1 = await User.findOne({ email });

    if (existingUser1) {
      res.status(401).json({
        success: false,
        message: "email already exists",
      });
      return;
    }
    let otp = Math.floor(1000 + Math.random() * 9000);

    let user = await User.create({
      name,
      email,
      username: email.split("@")[0],
      password,
      otp,
      fcmId: fcmId,
    });
    const info = await transporter.sendMail({
      from: '"Rent Sphere" <helloengg.420@gmail.com>',
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">🔒 Verification Code</h2>
          <p>Hi <strong>${email.split("@")[0]}</strong>,</p>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 1.5em; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px dashed #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
              ${otp}
            </span>
          </div>
          <p>This code is valid for the next <strong>10 minutes</strong>. Please do not share this code with anyone for your security.</p>
          <p>If you did not request this code, please ignore this email or <a href="https://rentsphere.annds.online/support" style="color: #4CAF50; text-decoration: none;">contact our support team</a> immediately.</p>
          <p style="margin-top: 20px; font-style: italic; color: #777;">Stay secure,<br>The Rent Sphere Team</p>
        </div>
      `,
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not cerated",
      });
      return;
    }

    user = await User.findById(user?._id).select("-password -otp");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { otp, id } = req.body;

    if (!otp) {
      res.status(401).json({
        success: false,
        message: "Please enter OTP",
      });
      return;
    }
    if (!id) {
      res.status(401).json({
        success: false,
        message: "User not registered please register again",
      });
      return;
    }

    let user = await User.findById(id).select("+otp");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not registered please register again",
      });
      return;
    }

    if (user.otp !== otp) {
      res.status(401).json({
        success: false,
        message: "OTP does not match",
      });
      return;
    }

    user.isVerified = true;
    user.otp = null;

    await user.save();
    user = await User.findById(user._id).select("-password -otp");
    res.status(200).json({
      success: true,
      message: "User verified successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { code } = req.query;
    const { fcmId } = req.body;
    console.log(fcmId);
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );

    const { email, name, picture, verified_email } = userRes.data;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name,
        email: email,
        password: "",
        username: email.split("@")[0],
        profilePicture: picture,
        isVerified: verified_email,
        fcmId: fcmId,
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
      });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not cerated",
      });
      return;
    }

    await user.save();
    user = await User.findOne({ email });
    user.fcmId = fcmId;
    const token = generateToken(user._id);

    await user.save();

    res.json({
      success: true,
      message: "Login Successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, fcmId } = req.body;

    if (!email || !password) {
      res.status(401).json({
        success: false,
        message: "Please enter all required fields",
      });
      return;
    }

    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    if (!user.isVerified) {
      let otp = Math.floor(1000 + Math.random() * 9000);
      const info = await transporter.sendMail({
        from: '"Rent Sphere" <helloengg.420@gmail.com>',
        to: email,
        subject: "Your Verification Code",
        text: `Hi ${user.username},
  
              Your One-Time Password (OTP) for verification is: ${otp}
  
              This code is valid for the next 10 minutes. Please do not share this code with anyone for your security.
  
              If you did not request this code, please ignore this email or contact our support team immediately.
  
              Stay secure,
              The Rent Sphere Team`,
      });
      
      user.otp = otp;
      await user.save();
      res.status(401).json({
        success: false,
        message: "User not verified please verify user",
      });
      return;
    }
    user.fcmId = fcmId;
    const token = generateToken(user._id);

    await user.save();
    res.json({
      success: true,
      message: "Login Successful",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const userProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user.isVerified) {
      let otp = Math.floor(1000 + Math.random() * 9000);
      const info = await transporter.sendMail({
        from: '"Rent Sphere" <helloengg.420@gmail.com>',
        to: user.email,
        subject: "Your Verification Code",
        text: `Hi ${user.username},
  
              Your One-Time Password (OTP) for verification is: ${otp}
  
              This code is valid for the next 10 minutes. Please do not share this code with anyone for your security.
  
              If you did not request this code, please ignore this email or contact our support team immediately.
  
              Stay secure,
              The Rent Sphere Team`,
      });

      user.otp = otp;

      await user.save();
      res.status(401).json({
        success: false,
        message: "User not verified please verify user",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const user = req.user;
    const { duration, mobileNo, amount } = req.body;
    const { productId } = req.params;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Please Login to create order",
      });
      return;
    }

    if (!duration || !mobileNo || !amount) {
      res.status(401).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    if (!productId) {
      res.status(401).json({
        success: false,
        message: "Please provide product id",
      });
      return;
    }

    const product = await Product.findById(productId);

    if (!product) {
      res.status(401).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const order = await Order.create({
      owner: product.owner,
      user: user._id,
      productId: product._id,
      duration: duration,
      mobileNo: mobileNo,
      amount: amount,
      status: "pending",
      orderDate: new Date(),
    });

    if (!order) {
      res.status(401).json({
        success: false,
        message: "Failed to create order",
      });
      return;
    }

    await user.rentals.push(order._id);
    await user.save();
    const owner = await User.findById(product.owner);
    await owner.reciveOrders.push(order._id);
    await owner.save();

    const ownerMail = await transporter.sendMail({
      from: '"Rent Sphere" <helloengg.420@gmail.com>',
      to: owner.email,
      subject: "New Order Received for Your Listing!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">🎉 New Order Alert! 🎉</h2>
          <p>Hi <strong>${owner.username}</strong>,</p>
          <p>Great news! You've received a new order for one of your listings on <strong>Rent Sphere</strong>.</p>
          <div style="border: 1px solid #4CAF50; border-radius: 5px; padding: 15px; background-color: #e8f5e9; margin: 15px 0;">
            <p><strong>Order Details:</strong></p>
            <ul style="list-style-type: none; padding: 0;">
              <li><strong>Order ID:</strong> ${order._id}</li>
              <li><strong>Item(s):</strong> ${product.title}</li>
              <li><strong>Renter Name:</strong> ${user.name}</li>
              <li><strong>Rental Duration:</strong> ${duration} days</li>
              <li><strong>Total Amount:</strong> ${amount}Rs</li>
            </ul>
          </div>
          <p>Please log in to your <a href="https://rentsphere.annds.online/support" style="color: #4CAF50; text-decoration: none;">Rent Sphere</a> account to view and manage the order.</p>
          <p>If you have any questions or concerns about this order, don't hesitate to contact our support team.</p>
          <p style="margin-top: 20px;">Thank you for being a valued part of <strong>Rent Sphere</strong>. We appreciate your business!</p>
          <p style="font-style: italic; color: #777;">Best regards,<br>The Rent Sphere Team</p>
        </div>
      `,
    });

    const info = await transporter.sendMail({
      from: '"Rent Sphere" <helloengg.420@gmail.com>',
      to: user.email,
      subject: "Your Order Has Been Created Successfully!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">🎉 Order Confirmation 🎉</h2>
          <p>Hi <strong>${user.email.split("@")[0]}</strong>,</p>
          <p>Thank you for placing your order with <strong>Rent Sphere</strong>!</p>
          <div style="border: 1px solid #4CAF50; border-radius: 5px; padding: 15px; background-color: #e8f5e9; margin: 15px 0;">
            <p><strong>Order Details:</strong></p>
            <ul style="list-style-type: none; padding: 0;">
              <li><strong>Order ID:</strong> ${order._id}</li>
              <li><strong>Item(s):</strong> ${product.title}</li>
              <li><strong>Total Amount:</strong> ${amount}Rs</li>
              <li><strong>Rental Duration:</strong> ${duration} days</li>
            </ul>
          </div>
          <p>We are currently processing your order and will keep you updated on its status.</p>
          <p>If you have any questions or need assistance, feel free to reach out to our <a href="https://rentsphere.annds.online/support style="color: #4CAF50; text-decoration: none;">support team</a>.</p>
          <p style="margin-top: 20px;">Thank you for choosing <strong>Rent Sphere</strong>. Happy renting!</p>
          <p style="font-style: italic; color: #777;">Best regards,<br>The Rent Sphere Team</p>
        </div>
      `,
    });

    if (user.fcmId) {
      const title = "🎉Order Placed Successfully!🎉";
      const body = `Hi ${user.name}, your order ${order._id} has been placed and is being processed. Thank you for connecting with us!`;

      await sendNotificationToDevice({
        fcmToken: user.fcmId,
        title: title,
        body: body,
      });
    }

    if (owner.fcmId) {
      const title = "🛒 New Order Received!";
      const body = `Hi ${owner.name}, you have received a new order ${order._id}. Please prepare it for processing. Thank you for partnering with us!`;

      await sendNotificationToDevice({
        fcmToken: owner.fcmId,
        title: title,
        body: body,
      });
    }

    res.status(201).json({
      success: true,
      order,
      message: "Order created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const sendNotification = (req, res) => {
  try {
    const user = req.user;
    const fcmId =
      "cDeQm0_lMmZO5g5Ezc2qqX:APA91bG2N7E8O2nOQYTJM5bWPYFcRrcy_1xLyNYdUCPFwNRKc3b96oGqR4aH1m_9G6NUtdCBFG_MFhAhP3_umIW-hvkegbku3RsGmVEjSJgqEymT_R7JB58";
    const title = "test title";
    const body = "test body";
    sendNotificationToDevice({ fcmToken: fcmId, title: title, body: body });

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

module.exports = {
  registerUser,
  googleLogin,
  verifyUser,
  loginUser,
  userProfile,
  createOrder,
  sendNotification,
};
