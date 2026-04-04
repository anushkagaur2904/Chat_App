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
