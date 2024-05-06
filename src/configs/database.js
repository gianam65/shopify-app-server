const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("DATABASE connect success !!!");
    })
    .catch((error) => {
      console.log("error :>> ", error);
    });
};

module.exports = { connectDatabase };
