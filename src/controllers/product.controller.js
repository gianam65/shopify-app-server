const Product = require("../models/product.model");
const Shop = require("../models/shop.model");
const ProductConfig = require("../models/product-config.model");
const axios = require("axios");
const {
  DEFAULT_CONFIG_COLOR,
  DEFAULT_CONFIG_SIZE,
  DEFAULT_CONFIG_MESSAGE,
} = require("../constants");

const getAllProducts = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];
    let query = { shopName };

    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: "i" };
    }

    const products = await Product.find(query);
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const existingProduct = await Product.findOne({ name: req.body.name });
    if (existingProduct) {
      return res
        .status(400)
        .json({ success: false, message: "Product already exists" });
    }
    const product = await Product.create(req.body);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

const getProductMetafields = async (shopName, accessToken, productId) => {
  const url = `https://${shopName}/admin/api/2024-04/products/${productId}/metafields.json`;
  const config = {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  };
  try {
    const response = await axios.get(url, config);
    return response.data?.metafields || [];
  } catch (error) {
    return [];
  }
};

const updateProductMetafield = async (
  shopName,
  accessToken,
  productId,
  metafieldId,
  metafieldData,
) => {
  const url = `https://${shopName}/admin/api/2024-04/products/${productId}/metafields/${metafieldId}.json`;
  const config = {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  };
  try {
    await axios.patch(url, metafieldData, config);
    return true;
  } catch (error) {
    return error;
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const shopName = req.headers["shop"];

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const shop = await Shop.findOne({ name: shopName });
    if (!shop) {
      return res.status(501).json({
        success: false,
        message: "Can not find current shop",
      });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      {
        new: true,
      },
    );
    const metaFieldData = {
      metafield: {
        namespace: "app_block_config",
        key: "config",
        value: JSON.stringify(
          {
            message: updatedProduct.message,
            color: updatedProduct.color,
            fontSize: updatedProduct.fontSize,
          },
          " ",
        ),
        type: "json",
      },
    };
    const accessToken = shop.accessToken;
    const productMetafields = await getProductMetafields(
      shopName,
      accessToken,
      product.mappingId,
    );
    const isExistConfigMetafield = productMetafields.find(
      (p) => p.namespace === "app_block_config",
    );
    if (isExistConfigMetafield) {
      const resultUpdate = await updateProductMetafield(
        shopName,
        accessToken,
        productId,
        isExistConfigMetafield?.id,
        {
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
        },
      );
      if (resultUpdate !== true)
        return res.json({ success: false, message: resultUpdate });
    } else {
      const url = `https://${shopName}/admin/api/2024-04/products/${product.mappingId}/metafields.json`;
      const config = {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      };
      try {
        await axios.post(url, metaFieldData, config);
      } catch (error) {
        return res.json({ success: false, message: error });
      }
    }
    res.json({ success: true, data: updatedProduct });
  } catch (err) {
    return next(err);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await product.remove();
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    return next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

const syncProductWithShopify = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];
    const shop = await Shop.findOne({ name: shopName });

    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }
    const accessToken = shop.accessToken;
    const apiUrl = `https://${shopName}/admin/api/2024-04/products.json`;
    const config = {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    };
    const response = await axios.get(apiUrl, config);
    const shopifyProducts = response?.data?.products || [];

    const existingProducts = await Product.find({
      mappingId: { $in: shopifyProducts.map((product) => product.id) },
    });

    const existingProductsMap = new Map(
      existingProducts.map((product) => [product.mappingId, product]),
    );

    const newProducts = [];
    const updatedProducts = [];
    const defaultProductConfig =
      (await ProductConfig.findOne({ shopName })) || {};
    const { message, color, fontSize } = defaultProductConfig;

    for (const shopifyProduct of shopifyProducts) {
      const existingProduct = existingProductsMap.get(
        shopifyProduct.id.toString(),
      );

      if (existingProduct) {
        updatedProducts.push(existingProduct.save());
      } else {
        newProducts.push(
          Product.create({
            name: shopifyProduct.title,
            message: message || DEFAULT_CONFIG_MESSAGE,
            color: color || DEFAULT_CONFIG_COLOR,
            fontSize: fontSize || DEFAULT_CONFIG_SIZE,
            mappingId: shopifyProduct.id,
            image: shopifyProduct.image?.src || "",
            shopName,
          }),
        );
      }
    }

    await Promise.all([...updatedProducts, ...newProducts]);
    const syncedProducts = await Product.find({ shopName });

    res.json({
      success: true,
      data: syncedProducts,
    });
  } catch (error) {
    return next(error);
  }
};

const searchProductsByName = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];
    const productName = req.query.name;

    const products = await Product.find({
      name: { $regex: productName, $options: "i" },
      shopName,
    });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

const updateAllProducts = async (req, res, next) => {
  try {
    const shopName = req.headers["shop"];
    const updateData = req.body;

    const updatedProducts = await Product.updateMany({ shopName }, updateData);

    res.status(200).json({
      success: true,
      message: "All products updated successfully",
      data: updatedProducts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  removeProduct,
  getProductById,
  syncProductWithShopify,
  searchProductsByName,
  updateAllProducts,
};
