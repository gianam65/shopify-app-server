const mongoose = require("mongoose");

const ProductConfigSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  color: {
    type: String,
  },
  fontSize: {
    type: Number,
  },
  shopName: {
    type: String,
  },
  mappingId: {
    type: Number,
  },
});

module.exports = mongoose.model("ProductConfig", ProductConfigSchema);
