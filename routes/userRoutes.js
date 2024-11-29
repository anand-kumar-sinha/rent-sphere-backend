const express = require("express");
const { protect } = require("../middleware/Auth");
const { googleLogin, registerUser, verifyUser, loginUser, userProfile, createOrder, sendNotification } = require("../controller/userController");

const router = express.Router();

router.route("/google/auth").post(googleLogin);
router.route("/auth/register").post(registerUser);
router.route("/auth/user/verify").post(verifyUser);
router.route("/auth/login").post(loginUser);
router.route("/user/profile").get(protect,userProfile);
router.route("/user/order/create/:productId").post(protect,createOrder);
router.route("/noti").post(sendNotification);

module.exports = router;
