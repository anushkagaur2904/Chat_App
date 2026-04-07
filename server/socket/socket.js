const users = {};

export const setupSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: { origin: "http://localhost:5173" }
  });

  io.on("connection", (socket) => {

    socket.on("join", (userId) => {
      users[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(users));
    });

    socket.on("disconnect", () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          break;
        }
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
  
    

  });
};
