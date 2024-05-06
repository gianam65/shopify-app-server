const express = require("express");
const routes = express.Router();

routes.use("/api/v1/products", require("./v1/product.routes"));
routes.use("/api/v1/product-config", require("./v1/product-config.routes"));
routes.use("/api/v1/shops", require("./v1/shop.routes"));

module.exports = routes;
