const mongoose = require("mongoose");

exports.connectDataBase = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then((con) => {
      console.log(`Database is connected: ${con.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};