//<!-- GU CPSC 332 Example NodeJS server with Mongoose connecting to MongoDB -->
//Database connection file

//used for our MongoDB database connection
//https://mongoosejs.com/docs/guide.html
const mongoose = require("mongoose");

//used for our database connections
const url = "mongodb://127.0.0.1:27017/"; //part of the database connection string
const DB_NAME = "testDB"; //database name

//connecting to our database.
//NOTE: for some reason localhost would not work for me but the localhost IP address worked.
mongoose.connect(url + DB_NAME, { useNewUrlParser: true });

//make our mongoose object available outside of this file when we export
module.exports = mongoose;