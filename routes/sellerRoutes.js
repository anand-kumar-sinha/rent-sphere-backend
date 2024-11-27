const express = require("express");
const { protect } = require("../middleware/Auth");
const {
  sellerFetchProduct,
  selleraddProduct,
  sellerupdateProduct,
  sellerdeleteProduct,
} = require("../controller/sellerController");
const uploadMiddleware = require("../middleware/uploadImages");

const router = express.Router();

router.route("/seller/product/fetch").get(protect, sellerFetchProduct);
router
  .route("/seller/product/add")
  .post(protect, uploadMiddleware, selleraddProduct);
router.route("/seller/product/update/:id").post(protect, sellerupdateProduct);
router.route("/seller/product/delete/:id").delete(protect, sellerdeleteProduct);

module.exports = router;
