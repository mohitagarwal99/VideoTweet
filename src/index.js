// require('dotenv').config({ path: './.env' })

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Listening on port ${process.env.PORT}`);
    });
    app.on("error", (err) => {
      console.log("Error: ", err);
      throw err;
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error ", error);
    process.exit(1);
  });

/* One of the approach is to put the code in index.js file itself but it does pollutes/floods the index.js

import mongoose from 'mongoose'
import { DB_NAME } from './constants';
import express from "express"
const app = express();

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error", (error) => {
            console.log("ERRR: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log("Listening on port 3000")
        })

    } catch (error) {
        console.error(error)
        throw error
    }
})()
    */
