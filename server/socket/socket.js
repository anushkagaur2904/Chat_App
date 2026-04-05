const users = {};

export const setupSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:5173"
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      users[userId] = socket.id;
    });

    socket.on("sendMessage", ({ senderId, receiverId, message }) => {
      const receiverSocket = users[receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId,
          message
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");

      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
        }
      }
    });
  });
};
