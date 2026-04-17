import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || response.statusText);
  }

  return response.json();
};

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initialState = {
  name: "",
  email: "",
  password: ""
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authValues, setAuthValues] = useState(initialState);
  const [token, setToken] = useState(localStorage.getItem("chatToken") || "");
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("chatUser") || "null"));
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [notification, setNotification] = useState("");
  const [file, setFile] = useState(null);
  const [statusText, setStatusText] = useState("Disconnected");
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);

  const socket = useMemo(() => socketRef.current, []);

  const isLoggedIn = !!token && !!currentUser;

  const updateSession = (tokenValue, user) => {
    setToken(tokenValue);
    setCurrentUser(user);
    localStorage.setItem("chatToken", tokenValue);
    localStorage.setItem("chatUser", JSON.stringify(user));
  };

  const clearSession = () => {
    setToken("");
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    setOnlineUsers([]);
    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");
  };

  useEffect(() => {
    if (isLoggedIn) {
      initializeSocket();
      loadUsers();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const initializeSocket = async () => {
    if (socketRef.current) return;

    const socketClient = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"]
    });

    socketRef.current = socketClient;

    socketClient.on("connect", () => {
      setStatusText("Connected");
      socketClient.emit("join", currentUser._id);
    });

    socketClient.on("onlineUsers", (online) => {
      setOnlineUsers(online);
    });

    socketClient.on("typing", (senderId) => {
      if (!selectedUser || senderId !== selectedUser._id) return;
      setTypingUser(selectedUser.name);
    });

    socketClient.on("stopTyping", () => setTypingUser(null));

    socketClient.on("receiveMessage", async (data) => {
      if (data.senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, data]);
      } else {
        setNotification(`New message from ${data.senderName}`);
      }
      await loadUsers();
    });

    socketClient.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) => prev.map((item) => item._id === messageId ? { ...item, status: "delivered" } : item));
    });

    socketClient.on("disconnect", () => setStatusText("Disconnected"));
  };

  const setAuthValue = (key, value) => {
    setAuthValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = authMode === "signup"
        ? { name: authValues.name, email: authValues.email, password: authValues.password }
        : { email: authValues.email, password: authValues.password };

      const options = {
        method: "POST",
        body: JSON.stringify(payload)
      };

      if (token) {
        options.headers = { Authorization: `Bearer ${token}` };
      }

      const data = await apiFetch(endpoint, options);

      updateSession(data.token, data.user || { _id: data._id, name: data.name, email: data.email });
      setStatusText("Connected");
      setAuthValues(initialState);
      setTimeout(() => loadUsers(), 100);
    } catch (error) {
      setNotification(error.message);
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      setUsers(data);
    } catch (error) {
      setNotification(error.message);
    }
  };

  const loadMessages = async (userId) => {
    if (!token) return;
    try {
      const data = await apiFetch(`/api/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(data);
      await apiFetch(`/api/messages/seen/${userId}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch (error) {
      setNotification(error.message);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setTypingUser(null);
  };

  const sendTypingEvent = () => {
    const socketClient = socketRef.current;
    if (!socketClient || !selectedUser) return;
    socketClient.emit("typing", { receiverId: selectedUser._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socketClient.emit("stopTyping", { receiverId: selectedUser._id }), 800);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedUser || !messageText.trim()) return;

    try {
      const result = await apiFetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({ receiverId: selectedUser._id, message: messageText.trim() }),
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages((prev) => [...prev, { ...result, senderId: currentUser, receiverId: selectedUser, status: "sent" }]);
      setMessageText("");
      socketRef.current?.emit("sendMessage", { receiverId: selectedUser._id, messageId: result._id });
      loadUsers();
    } catch (error) {
      setNotification(error.message);
    }
  };

  const handleFileUpload = async (selectedFile) => {
    if (!selectedUser || !selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("receiverId", selectedUser._id);

    try {
      const response = await fetch(`${API_URL}/api/messages/media`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      const uploaded = await response.json();
      setMessages((prev) => [...prev, { ...uploaded, senderId: currentUser, receiverId: selectedUser }]);
      setFile(null);
      socketRef.current?.emit("sendMessage", { receiverId: selectedUser._id, messageId: uploaded._id });
      loadUsers();
    } catch (error) {
      setNotification(error.message);
    }
  };

  const handleLogout = () => {
    socketRef.current?.disconnect();
    clearSession();
  };

  const unreadBadge = (user) => user.unreadCount > 0 ? <span className="badge">{user.unreadCount}</span> : null;

  return (
    <div className="chat-app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <strong>Chat_App</strong>
          {isLoggedIn && <button className="secondary-button" onClick={handleLogout}>Sign out</button>}
        </div>

        {!isLoggedIn ? (
          <form className="auth-card" onSubmit={handleAuthSubmit}>
            <h2>{authMode === "login" ? "Login" : "Sign up"}</h2>
            {authMode === "signup" && (
              <label>
                Name
                <input value={authValues.name} onChange={(e) => setAuthValue("name", e.target.value)} placeholder="Your name" required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={authValues.email} onChange={(e) => setAuthValue("email", e.target.value)} placeholder="name@example.com" required />
            </label>
            <label>
              Password
              <input type="password" value={authValues.password} onChange={(e) => setAuthValue("password", e.target.value)} placeholder="••••••••" required />
            </label>
            <button className="primary-button" type="submit">{authMode === "login" ? "Log in" : "Create account"}</button>
            <button className="link-button" type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>{authMode === "login" ? "Create an account" : "Already have an account?"}</button>
          </form>
        ) : (
          <div className="contacts-card">
            <div className="contacts-header">
              <div>
                <p className="meta">Logged in as</p>
                <h3>{currentUser.name}</h3>
              </div>
              <div className={`status-pill ${statusText === "Connected" ? "online" : "offline"}`}>{statusText}</div>
            </div>
            <div className="contact-list">
              {users.map((user) => (
                <button
                  key={user._id}
                  className={`contact-item ${selectedUser?._id === user._id ? "active" : ""}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div>
                    <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong>{user.name}</strong>
                      <div className="contact-meta">{user.online ? "Online" : `Last seen ${new Date(user.lastSeen).toLocaleString()}`}</div>
                    </div>
                  </div>
                  {unreadBadge(user)}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="chat-panel">
        {!isLoggedIn ? (
          <div className="welcome-card">
            <h1>Real-time chat built for speed</h1>
            <p>Sign in or sign up to experience instant messaging, typing indicators, and media sharing.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div>
                <p className="meta">{selectedUser ? "Chatting with" : "Choose a contact to start"}</p>
                <h2>{selectedUser ? selectedUser.name : "No contact selected"}</h2>
                {selectedUser && typingUser && <p className="typing-indicator">{typingUser} is typing...</p>}
              </div>
              {selectedUser && <span className="tag">Live</span>}
            </div>

            <div className="message-board">
              {selectedUser ? (
                messages.length ? messages.map((message) => (
                  <div key={message._id} className={`message-card ${message.senderId._id === currentUser._id ? "sent" : "received"}`}>
                    {message.type === "image" ? (
                      <img src={`${API_URL}${message.media}`} alt="shared media" />
                    ) : (
                      <p>{message.message}</p>
                    )}
                    <div className="message-footer">
                      <span>{formatTime(message.createdAt)}</span>
                      {message.senderId._id === currentUser._id && <span className="message-status">{message.status || "sent"}</span>}
                    </div>
                  </div>
                )) : <p className="empty-state">No conversation yet with {selectedUser.name}.</p>
              ) : (
                <div className="empty-state">Select a contact to start chatting.</div>
              )}
            </div>

            {selectedUser && (
              <form className="composer" onSubmit={handleSendMessage}>
                <label className="file-upload">
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  Attach
                </label>
                <input
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    sendTypingEvent();
                  }}
                  placeholder="Write a message..."
                />
                <button className="primary-button" type="submit">Send</button>
                {file && <button type="button" className="secondary-button" onClick={() => handleFileUpload(file)}>Upload</button>}
              </form>
            )}
          </>
        )}
      </main>

      {notification && <div className="toast">{notification}</div>}
    </div>
  );
}

export default App;
