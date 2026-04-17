import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import User from "../models/User.js";

const users = {};
const socketMap = {};

export const getOnlineUsers = () => Object.keys(users);

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: ["http://localhost:3000", "http://localhost:5173"], methods: ["GET", "POST"] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {

    socket.on("join", (userId) => {
      if (socket.userId !== userId) {
        return;
      }
      users[userId] = socket.id;
      socketMap[socket.id] = userId;
      io.emit("onlineUsers", Object.keys(users));
    });

    socket.on("disconnect", async () => {
      const userId = socketMap[socket.id];
      if (userId) {
        delete users[userId];
        delete socketMap[socket.id];
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      }

      io.emit("onlineUsers", Object.keys(users));
    });
    socket.on("typing", ({ receiverId }) => {
  const receiverSocket = users[receiverId];

  if (receiverSocket) {
    io.to(receiverSocket).emit("typing", socket.id);
  }
});

socket.on("stopTyping", ({ receiverId }) => {
  const receiverSocket = users[receiverId];

  if (receiverSocket) {
    io.to(receiverSocket).emit("stopTyping");
  }
});
    socket.on("sendMessage", async ({ receiverId, messageId }) => {
  try {
    const receiverSocket = users[receiverId];

    if (receiverSocket) {
      const msg = await Message.findById(messageId);

      if (!msg) return;

      io.to(receiverSocket).emit("receiveMessage", {
        senderId: msg.senderId,
        message: msg.message,
        messageId: msg._id
      });

      await Message.findByIdAndUpdate(messageId, {
        status: "delivered"
      });

      // notify sender
      io.to(socket.id).emit("messageDelivered", {
        messageId
      });
    }

  } catch (error) {
    console.log("Socket error:", error);
  }
});

    

  });
};
