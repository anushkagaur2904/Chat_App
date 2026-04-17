import User from '../models/User.js';
import Message from '../models/Message.js';
import { getOnlineUsers } from '../socket/socket.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id }
    }).select("_id name email lastSeen");

    const onlineIds = getOnlineUsers();
    const senderIds = users.map((user) => user._id);
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: req.user.id,
          senderId: { $in: senderIds },
          status: { $ne: "seen" }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = unreadCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    const response = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      lastSeen: user.lastSeen,
      online: onlineIds.includes(user._id.toString()),
      unreadCount: unreadMap[user._id.toString()] || 0
    }));

    res.json(response);

  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};
