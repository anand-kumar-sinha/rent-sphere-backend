const User = require("../models/User");
const generateToken = require("../middleware/generateToken");
const { oauth2client } = require("../config/googleConfig");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");

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
      text: `Hi ${email.split("@")[0]},

            Your One-Time Password (OTP) for verification is: ${otp}

            This code is valid for the next 10 minutes. Please do not share this code with anyone for your security.

            If you did not request this code, please ignore this email or contact our support team immediately.

            Stay secure,
            The Rent Sphere Team`,
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
    const {fcmId} = req.body;
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

module.exports = {
  registerUser,
  googleLogin,
  verifyUser,
  loginUser,
  userProfile,
};
