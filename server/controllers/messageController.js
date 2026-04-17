import Message from '../models/Message.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newMessage = await Message.create({
      senderId: req.user.id,
      receiverId,
      message
    });

    res.status(201).json({
      _id: newMessage._id,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      message: newMessage.message,
      type: newMessage.type,
      media: newMessage.media,
      createdAt: newMessage.createdAt
    });

  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.json(messages);

  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const result = await Message.updateMany(
      {
        senderId: userId,
        receiverId: req.user.id,
        status: { $ne: "seen" }
      },
      { status: "seen" }
    );

    res.json({
      message: "Updated to seen",
      updatedCount: result.modifiedCount
    });

  } catch {
    res.status(500).json({ message: "Error" });
  }
};
export const sendMedia = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!req.file || !receiverId) {
      return res.status(400).json({ message: "File and receiver required" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newMessage = await Message.create({
      senderId: req.user.id,
      receiverId,
      media: fileUrl,
      type: "image",
      status: "sent"
    });

    res.status(201).json(newMessage);

  } catch {
    res.status(500).json({ message: "Error sending media" });
  }
};
