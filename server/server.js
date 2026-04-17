import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { setupSocket } from "./socket/socket.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

connectDB();

const app = express();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});

app.use(express.json());
app.use(cors());
app.use(apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const clientBuildPath = path.join(__dirname, "../client/dist");
const clientSourcePath = path.join(__dirname, "../client");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
} else {
  app.use(express.static(clientSourcePath));
}

app.get("/*", (req, res) => {
  const indexPath = fs.existsSync(path.join(clientBuildPath, "index.html"))
    ? path.join(clientBuildPath, "index.html")
    : path.join(clientSourcePath, "index.html");
  res.sendFile(indexPath);
});

const server = http.createServer(app);

setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
