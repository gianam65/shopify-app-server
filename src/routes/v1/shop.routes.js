const express = require("express");
const routes = express.Router();
const {
  getAll,
  getById,
  createShop,
  updateShop,
  removeShop,
} = require("../../controllers/shop.controller");

routes.get("/", getAll);

routes.get("/:shopId", getById);

routes.post("/", createShop);

routes.patch("/:shopId", updateShop);

routes.delete("/:shopId", removeShop);

module.exports = routes;
