const express = require("express");
const { protect } = require("../middleware/Auth");
const { googleLogin, registerUser, verifyUser, loginUser, userProfile } = require("../controller/userController");

const router = express.Router();

router.route("/google/auth").get(googleLogin);
router.route("/auth/register").get(registerUser);
router.route("/auth/user/verify").get(verifyUser);
router.route("/auth/login").get(loginUser);
router.route("/user/profile").get(protect,userProfile);

module.exports = router;
