import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { saveMessage } from "./controllers/message.controller.js";
import Message from "./models/message.model.js";
import { setIo, setOnlineUsers, getOnlineUsers } from "./socket.service.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use(postRoutes);
app.use(userRoutes);
app.use(messageRoutes);
app.use(express.static("uploads"));

// Online users: userId (String) -> socketId
const onlineUsers = new Map();
setIo(io);
setOnlineUsers(onlineUsers);

const emitOnlineUsers = () => {
  io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket) => {
  // User registers their userId when they connect
  socket.on("register", (userId) => {
    const uId = String(userId);
    onlineUsers.set(uId, socket.id);
    socket.data.userId = uId; // store for later use
    console.log(`[Socket] User ${uId} connected`);
    emitOnlineUsers();
  });

  // Handle sending a message
  socket.on("sendMessage", async ({ token, receiverId, message }) => {
    try {
      const recId = String(receiverId);
      const saved = await saveMessage({ token, receiverId: recId, message });
      if (!saved) return;

      // Send to receiver if they are online
      const receiverSocketId = onlineUsers.get(recId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", saved);
      }
      // Echo back to sender with saved data (has real _id)
      socket.emit("messageSaved", saved);
    } catch (err) {
      console.error("[Socket] sendMessage error:", err.message);
    }
  });

  // Typing indicator
  socket.on("typing", ({ receiverId }) => {
    const recId = String(receiverId);
    const receiverSocketId = onlineUsers.get(recId);
    if (receiverSocketId && socket.data.userId) {
      io.to(receiverSocketId).emit("typing", { senderId: socket.data.userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const recId = String(receiverId);
    const receiverSocketId = onlineUsers.get(recId);
    if (receiverSocketId && socket.data.userId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: socket.data.userId });
    }
  });

  // Mark messages as seen
  socket.on("markSeen", async ({ senderId }) => {
    try {
      const myId = socket.data.userId;
      if (!myId || !senderId) return;

      // Mark all messages from senderId to me as seen
      await Message.updateMany(
        { senderId, receiverId: myId, seen: false },
        { $set: { seen: true } }
      );

      // Notify the sender that their messages were seen
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", { by: myId });
      }
    } catch (err) {
      console.error("[Socket] markSeen error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`[Socket] User ${userId} disconnected`);
        emitOnlineUsers();
        break;
      }
    }
  });
});

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
  }, 14 * 60 * 1000);
};

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
      keepAlive();
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

start();

