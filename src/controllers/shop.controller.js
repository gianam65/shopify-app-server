const Shop = require("../models/shop.model");

const getAll = async (req, res, next) => {
  try {
    const shops = await Shop.find();
    res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res
        .status(400)
        .json({ success: false, message: "Shop not found" });
    }

    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    return next(err);
  }
};

const createShop = async (req, res, next) => {
  try {
    const existingShop = await Shop.findOne({ name: req.body.name });
    if (existingShop) {
      return res
        .status(400)
        .json({ success: false, message: "Shop already exists" });
    }
    const shop = await Shop.create(req.body);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    return next(err);
  }
};

const updateShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res
        .status(400)
        .json({ success: false, message: "Shop not found" });
    }

    const updatedShop = await Shop.findByIdAndUpdate(shopId, req.body, {
      new: true,
    });
    res.json({ success: true, data: updatedShop });
  } catch (err) {
    return next(err);
  }
};

const removeShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    // Check if the shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res
        .status(400)
        .json({ success: false, message: "Shop not found" });
    }

    await shop.remove();
    res.json({ success: true, message: "Shop deleted" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAll,
  getById,
  createShop,
  updateShop,
  removeShop,
};
