const ProductConfig = require("../models/product-config.model");
const {
  DEFAULT_CONFIG_COLOR,
  DEFAULT_CONFIG_SIZE,
  DEFAULT_CONFIG_MESSAGE,
} = require("../constants");
const Shop = require("../models/shop.model");
const axios = require("axios");

const updateShopMetafield = async (
  shopName,
  accessToken,
  metafieldData,
  metaId,
) => {
  const url = `https://${shopName}/admin/api/2024-04/metafields/${metaId}.json`;
  const config = {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  };
  try {
    await axios.patch(url, metafieldData, config);
    return true;
  } catch (error) {
    console.log("error :>> ", error);
    return error;
  }
};

const createShopMetafield = async (shopName, accessToken, metafieldData) => {
  const url = `https://${shopName}/admin/api/2024-04/metafields.json`;
  const config = {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  };
  return (await axios.post(url, JSON.stringify(metafieldData), config))?.data
    ?.metafield?.id;
};

const getConfig = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];
    let query = { shopName };

    const existingConfig = await ProductConfig.findOne(query);
    // Nếu chưa có config mặc định thì tạo thêm 1 config mặc định, bảng này chỉ có duy nhất 1 bản ghi
    if (!existingConfig) {
      const shop = await Shop.findOne({ name: shopName });
      if (!shop) {
        return res.status(501).json({
          success: false,
          message: "Can not find current shop",
        });
      }
      const metaFieldData = {
        metafield: {
          namespace: "app__product__config",
          key: "config",
          value: JSON.stringify(
            {
              message: DEFAULT_CONFIG_MESSAGE,
              color: DEFAULT_CONFIG_COLOR,
              fontSize: DEFAULT_CONFIG_SIZE,
            },
            " ",
          ),
          type: "json",
        },
      };
      const createdMetafieldsId = await createShopMetafield(
        shopName,
        shop.accessToken,
        metaFieldData,
      );
      if (!createdMetafieldsId)
        return res.status(400).json({
          success: true,
          data: [],
        });
      const newProduct = new ProductConfig({
        message: DEFAULT_CONFIG_MESSAGE,
        color: DEFAULT_CONFIG_COLOR,
        fontSize: DEFAULT_CONFIG_SIZE,
        shopName: shopName,
        mappingId: createdMetafieldsId,
      });
      const savedProduct = await newProduct.save();
      return res.status(201).json({
        success: true,
        data: savedProduct,
      });
    }

    res.status(200).json({
      success: true,
      data: existingConfig,
    });
  } catch (error) {
    return next(error);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];

    const product = await ProductConfig.findOne({ shopName });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "ProductConfig config not found" });
    }

    const updatedProduct = await ProductConfig.findByIdAndUpdate(
      product._id,
      req.body,
      {
        new: true,
      },
    );
    try {
      const shop = await Shop.findOne({ name: shopName });
      if (!shop) {
        return res.status(501).json({
          success: false,
          message: "Can not find current shop",
        });
      }
      const metaFields = {
        metafield: {
          value: JSON.stringify(
            {
              message: updatedProduct.message,
              color: updatedProduct.color,
              fontSize: updatedProduct.fontSize,
            },
            " ",
          ),
        },
      };
      await updateShopMetafield(
        shopName,
        shop.accessToken,
        metaFields,
        product.mappingId,
      );
    } catch (error) {
      console.log("error :>> ", error);
    }
    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getConfig,
  updateConfig,
};
