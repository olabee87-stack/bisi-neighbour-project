const express = require("express");
const app = express();
const PORT = 8020;
const mongoose = require("mongoose");

//Database connection specifying exact DB to make a connection to
mongoose.connect("mongodb://localhost:27017/test");

//Establishing a connection to mongoose
const db = mongoose.connection;
db.on("error", (err) => {
  console.log(`Error occured while connecting to DB:${err}`);
});
db.on("open", () => {
  console.log(`Successfully connected to the DB`);
});

//Localhost port
app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
