const express = require("express");
const { protect } = require("../middleware/Auth");
const { googleLogin, registerUser, verifyUser, loginUser, userProfile } = require("../controller/userController");

const router = express.Router();

router.route("/google/auth").get(googleLogin);
router.route("/auth/register").post(registerUser);
router.route("/auth/user/verify").post(verifyUser);
router.route("/auth/login").post(loginUser);
router.route("/user/profile").get(protect,userProfile);

module.exports = router;
