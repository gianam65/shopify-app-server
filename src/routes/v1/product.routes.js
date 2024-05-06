const express = require("express");
const routes = express.Router();
const {
  getAllProducts,
  createProduct,
  updateProduct,
  removeProduct,
  getProductById,
  syncProductWithShopify,
  searchProductsByName,
  updateAllProducts,
} = require("../../controllers/product.controller");

routes.get("/", getAllProducts);

routes.get("/search", searchProductsByName);

routes.get("/:productId", getProductById);

routes.post("/sync", syncProductWithShopify);

routes.post("/", createProduct);

routes.patch("/:productId", updateProduct);

routes.patch("/", updateAllProducts);

routes.delete("/:productId", removeProduct);

module.exports = routes;
