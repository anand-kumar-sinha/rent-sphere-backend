const express = require("express");
const { protect } = require("../middleware/Auth");
const {
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controller/productController");

const router = express.Router();

router.route("/fetch/product/all").get(getProducts);
router.route("/fetch/product/:id").get(getProductById);

module.exports = router;
