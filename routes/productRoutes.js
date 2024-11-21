const express = require("express");
const { protect } = require("../middleware/Auth");
const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controller/productController");

const router = express.Router();

router.route("/seller/product/add").post(protect, addProduct);
router.route("/fetch/product/all").get(getProducts);
router.route("/fetch/product/:id").get(getProductById);
router.route("/update/product/:id").put(protect, updateProduct);
router.route("/delete/product/:id").delete(protect, deleteProduct);

module.exports = router;
