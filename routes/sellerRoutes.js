const express = require("express");
const { protect } = require("../middleware/Auth");
const {
  sellerFetchProduct,
  selleraddProduct,
  sellerupdateProduct,
  sellerdeleteProduct,
  sellerFetchOrder,
  sellerDahsboard,
} = require("../controller/sellerController");
const uploadMiddleware = require("../middleware/uploadImages");

const router = express.Router();

router.route("/seller/product/fetch").get(protect, sellerFetchProduct);
router.route("/seller/order/fetch").get(protect, sellerFetchOrder);
router.route("/seller/order/dashboard").get(protect, sellerDahsboard);
router
  .route("/seller/product/add")
  .post(protect, uploadMiddleware, selleraddProduct);
router.route("/seller/product/update/:id").post(protect, sellerupdateProduct);
router.route("/seller/product/delete/:id").delete(protect, sellerdeleteProduct);

module.exports = router;
