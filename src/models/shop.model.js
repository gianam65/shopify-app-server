const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
    unique: true,
  },
  scope: {
    type: String,
  },
});

module.exports = mongoose.model("Shop", ShopSchema);
