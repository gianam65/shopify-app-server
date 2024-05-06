const express = require("express");
const routes = express.Router();
const {
  getConfig,
  updateConfig,
} = require("../../controllers/product-config.controller");

routes.get("/", getConfig);

routes.patch("/", updateConfig);

module.exports = routes;
