const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    color: {
      type: String,
    },
    fontSize: {
      type: Number,
    },
    mappingId: {
      type: String,
    },
    image: {
      type: String,
    },
    shopName: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
