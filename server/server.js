import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import http from "http";
import { setupSocket } from "./socket/socket.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";


dotenv.config();
connectDB();

const app = express();

app.listen(express.json());
app.use(cors());
app.use("/api/messages",messageRoutes);
app.use("/api/users", userRoutes);


const server = http.createServer(app);

setupSocket(server);

server.listen(5000, () => console.log("Server running"));
