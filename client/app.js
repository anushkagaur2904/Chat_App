const authCard = document.getElementById("authCard");
const userCard = document.getElementById("userCard");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authButton = document.getElementById("authButton");
const toggleAuth = document.getElementById("toggleAuth");
const authToggleText = document.getElementById("authToggleText");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const usersList = document.getElementById("usersList");
const messagesArea = document.getElementById("messagesArea");
const chatWith = document.getElementById("chatWith");
const chatSubtitle = document.getElementById("chatSubtitle");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const onlineStatus = document.getElementById("onlineStatus");
const signOutButton = document.getElementById("signOutButton");
const userWelcome = document.getElementById("userWelcome");

let isSignup = false;
let token = null;
let currentUser = null;
let selectedUser = null;
let socket = null;
let messages = [];
let onlineUsers = [];

const apiFetch = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || response.statusText);
  }

  return response.json();
};

const updateAuthForm = () => {
  authTitle.textContent = isSignup ? "Sign up" : "Login";
  authButton.textContent = isSignup ? "Create account" : "Log in";
  toggleAuth.textContent = isSignup ? "Log in" : "Sign up";
  authToggleText.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  nameInput.style.display = isSignup ? "block" : "none";
};

const setStatus = (message) => {
  onlineStatus.textContent = message;
};

const renderUsers = (userArray) => {
  usersList.innerHTML = "";

  userArray.forEach((user) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = user.name.charAt(0).toUpperCase();
    label.appendChild(avatar);
    label.append(user.name);
    item.appendChild(label);
    item.dataset.userId = user._id;
    if (selectedUser?._id === user._id) item.classList.add("active");

    const badge = document.createElement("span");
    badge.textContent = onlineUsers.includes(user._id) ? "Online" : "Offline";
    badge.style.fontSize = "0.78rem";
    badge.style.color = onlineUsers.includes(user._id) ? "#0f766e" : "#6b7280";
    item.appendChild(badge);

    item.addEventListener("click", () => selectUser(user));
    usersList.appendChild(item);
  });
};

const renderMessages = () => {
  messagesArea.innerHTML = "";
  messagesArea.classList.remove("hidden");

  messages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${message.senderId._id === currentUser._id ? "sent" : "received"}`;
    bubble.innerHTML = `<div>${message.message || message.media || "[media]"}</div>
      <div class="meta">${message.senderId.name} • ${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
    messagesArea.appendChild(bubble);
  });

  messagesArea.scrollTop = messagesArea.scrollHeight;
};

const showChatPanel = () => {
  authCard.classList.add("hidden");
  userCard.classList.remove("hidden");
  messageForm.classList.remove("hidden");
  signOutButton.classList.remove("hidden");
  userWelcome.textContent = `Welcome back, ${currentUser.name}`;
};

const updateChatHeader = () => {
  if (!selectedUser) {
    chatWith.textContent = "Select a contact";
    chatSubtitle.textContent = "Pick a user to start a conversation.";
    return;
  }

  chatWith.textContent = `Chat with ${selectedUser.name}`;
  chatSubtitle.textContent = onlineUsers.includes(selectedUser._id) ? "Online now" : "Offline";
};

const selectUser = async (user) => {
  selectedUser = user;
  updateChatHeader();
  renderUsers(await loadUsers());
  messages = await loadMessages(user._id);
  renderMessages();
};

const loadUsers = async () => {
  const data = await apiFetch("/api/users");
  return data;
};

const loadMessages = async (userId) => {
  const data = await apiFetch(`/api/messages/${userId}`);
  return data;
};

const handleAuth = async (event) => {
  event.preventDefault();
  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();

    if (isSignup && !name) {
      alert("Please enter your name.");
      return;
    }

    const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignup ? { name, email, password } : { email, password };
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    token = result.token;
    currentUser = result.user || { _id: result._id, name: result.name, email: result.email };
    setStatus("Connected");
    showChatPanel();
    await initializeSocket();
    const users = await loadUsers();
    renderUsers(users);
    updateChatHeader();
    userWelcome.textContent = `Welcome back, ${currentUser.name}`;

  } catch (error) {
    alert(error.message);
  }
};

const initializeSocket = async () => {
  if (socket) return;

  socket = io({ transports: ["websocket"] });
  socket.on("connect", () => {
    socket.emit("join", currentUser._id);
  });

  socket.on("onlineUsers", (online) => {
    onlineUsers = online;
    setStatus(online.includes(currentUser._id) ? "Connected" : "Connected");
    if (selectedUser) updateChatHeader();
    loadUsers().then(renderUsers).catch(() => {});
  });

  socket.on("receiveMessage", (data) => {
    if (!selectedUser || data.senderId !== selectedUser._id) {
      return;
    }
    messages.push({
      _id: data.messageId,
      senderId: { _id: data.senderId, name: selectedUser.name },
      receiverId: { _id: currentUser._id, name: currentUser.name },
      message: data.message,
      createdAt: new Date().toISOString()
    });
    renderMessages();
  });
};

const handleSendMessage = async (event) => {
  event.preventDefault();
  if (!selectedUser) {
    alert("Select a contact first.");
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  try {
    const result = await apiFetch("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({ receiverId: selectedUser._id, message: text })
    });

    messages.push({
      ...result,
      senderId: { _id: currentUser._id, name: currentUser.name },
      receiverId: selectedUser,
      createdAt: result.createdAt
    });
    renderMessages();
    messageInput.value = "";

    if (socket) {
      socket.emit("sendMessage", {
        receiverId: selectedUser._id,
        messageId: result._id
      });
    }
  } catch (error) {
    alert(error.message);
  }
};

const restoreSession = () => {
  const savedToken = localStorage.getItem("chatToken");
  const savedUser = localStorage.getItem("chatUser");

  if (savedToken && savedUser) {
    token = savedToken;
    currentUser = JSON.parse(savedUser);
    showChatPanel();
    userWelcome.textContent = `Welcome back, ${currentUser.name}`;
    initializeSocket().then(async () => {
      const users = await loadUsers();
      renderUsers(users);
    });
  }
};

const saveSession = () => {
  if (token && currentUser) {
    localStorage.setItem("chatToken", token);
    localStorage.setItem("chatUser", JSON.stringify(currentUser));
  }
};

const clearSession = () => {
  localStorage.removeItem("chatToken");
  localStorage.removeItem("chatUser");
};

const signOut = () => {
  token = null;
  currentUser = null;
  selectedUser = null;
  messages = [];
  onlineUsers = [];
  clearSession();
  window.location.reload();
};

authForm.addEventListener("submit", async (event) => {
  await handleAuth(event);
  saveSession();
});

toggleAuth.addEventListener("click", () => {
  isSignup = !isSignup;
  updateAuthForm();
});

messageForm.addEventListener("submit", handleSendMessage);
signOutButton.addEventListener("click", signOut);

updateAuthForm();
restoreSession();
