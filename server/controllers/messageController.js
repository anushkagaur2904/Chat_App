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
      createdAt: newMessage.createdAt
    });

  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
};
