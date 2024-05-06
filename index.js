require("dotenv").config();

// Connect database
const { connectDatabase } = require("./src/configs/database");
connectDatabase();

const Shop = require("./src/models/shop.model");
const axios = require("axios");
const errorHandler = require("./src/middlewares/errorHandler");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const app = express();
const { shopifyApi } = require("@shopify/shopify-api");

require("@shopify/shopify-api/adapters/node");

const shopify = shopifyApi({
  apiKey: process.env.CLIENT_ID,
  apiSecretKey: process.env.CLIENT_SECRET,
  scopes: ["read_products,write_products"],
  hostName: "0a83-58-187-94-196.ngrok-free.app",
  hostScheme: "https",
});

function clientSideRedirect(req, res) {
  const redirectUriParams = new URLSearchParams({
    shop: req.query.shop,
    host: req.query.host,
  }).toString();
  const queryParams = new URLSearchParams({
    host: req.query.host,
    shop: req.query.shop,
    redirectUri: `https://${req.query.shop}/api/auth?${redirectUriParams}`,
  }).toString();

  return res.redirect(`/?${queryParams}`);
}

app.get("/auth", async (req, res) => {
  const { shop, embedded, host } = req.query;
  const existingShop = await Shop.findOne({ name: shop });
  if (existingShop) {
    embedded === "1" ? clientSideRedirect(req, res) : res.redirect("/");
    return;
  }
  await shopify.auth.begin({
    shop: shopify.utils.sanitizeShop(req.query.shop, true),
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
});

app.get("/auth/callback", async (req, res) => {
  try {
    const { code, shop } = req.query;
    const url = `https://${shop}/admin/oauth/access_token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}`;

    const response = await axios.post(url);
    if (response.data) {
      const { access_token, scope } = response?.data;
      const newShop = new Shop({
        name: shop,
        accessToken: access_token,
        scope: scope,
      });
      await newShop.save();
    }
    res.redirect("/");
  } catch (error) {
    res.redirect("/");
  }
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["self"],
      scriptSrc: [
        "self",
        "https://cdn.shopify.com",
        "https://admin.shopify.com",
        "https://*.ngrok-free.app",
      ],
      styleSrc: ["self", "unsafe-inline", "https://cdn.shopify.com"],
      frameAncestors: [
        "self",
        "https://*.myshopify.com",
        "https://*.ngrok-free.app",
      ],
    },
  }),
);

app.use(morgan("common"));
app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com https://cdn.shopify.com; script-src 'self' https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css; frame-src 'self' https://www.youtube.com https://youtube.com; connect-src 'self' http://localhost:6501;",
  );
  next();
});
app.use(require("./src/routes/index"));
app.use(
  express.static("/Users/admin/Documents/shopify-frontend-template-react/dist"),
);
// Error handler
app.all("*", (req, res, next) => {
  const error = new Error("Route not found !!!");
  error.statusCode = 404;
  next(error);
});
app.use(errorHandler);
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
