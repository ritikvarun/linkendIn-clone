import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use(postRoutes);
app.use(userRoutes);
app.use(express.static("uploads"));

// Keep-alive: Render free tier ko sleep se rokne ke liye har 14 min mein ping
const BACKEND_URL = process.env.BACKEND_URL || "https://linkendin-clone.onrender.com";
const keepAlive = () => {
  setInterval(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/`);
      console.log(`[Keep-Alive] Ping sent → Status: ${res.status}`);
    } catch (err) {
      console.error("[Keep-Alive] Ping failed:", err.message);
    }
  }, 14 * 60 * 1000); // 14 minutes
};

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
      keepAlive(); // Server start hone ke baad keep-alive shuru karo
    });
  } catch (error) {
    console.error(" Error connecting to MongoDB:", error.message);
  }
};

start();
