import express from "express";
import { sendMessage, getMessages, markAsSeen, sendMedia } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, "uploads/"),
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	}
});

const fileFilter = (req, file, cb) => {
	const allowedTypes = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Unsupported file type"), false);
	}
};

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter
});

router.post("/send", protect, sendMessage);
router.get("/:userId", protect, getMessages);
router.put("/seen/:userId", protect, markAsSeen);
router.post("/media", protect, upload.single("file"), sendMedia);

export default router;
