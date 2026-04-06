export const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id }
    }).select("_id name email");

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};
