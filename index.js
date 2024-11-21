const { connectDataBase } = require("./config/database");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*", 
    credentials: true,
    allowedHeaders: [
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "Accept",
      "Content-Type",
      "Content-Length",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  })
);
dotenv.config();
connectDataBase();

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/users", productRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server is Started on ${process.env.PORT} port`);
});
