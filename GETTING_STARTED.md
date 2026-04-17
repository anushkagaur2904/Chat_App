# Chat App - Getting Started

## Prerequisites

- **Node.js** (v16+) - [Download](https://nodejs.org)
- **MongoDB** running locally or a MongoDB Atlas connection string
- A terminal/command line interface

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
cd client && npm install
```

### Step 2: Create Environment File
Copy the example env file and add your values:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with:
```
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

**Note:** If using MongoDB Atlas, replace `MONGO_URI` with your connection string:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app?retryWrites=true&w=majority
```

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Start the React Frontend
```bash
cd client
npm run dev
```

You should see the backend message:
```
Server running on port 5000
MongoDB Connected
```

Open the app in the browser at **http://localhost:5173** while in development.
If you build the React app for production and serve it from the backend, open **http://localhost:5000** instead.

## Features

✅ **Sign up / Login** - Create an account and authenticate  
✅ **Contact List** - See all registered users  
✅ **Online Status** - Real-time online/offline indicator  
✅ **Send Messages** - Chat with any contact  
✅ **Live Updates** - Socket.io for instant message delivery  

## Project Structure

```
Chat_App/
├── server/
│   ├── server.js              # Main server entry
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Request handlers
│   ├── models/                # Data schemas
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth middleware
│   ├── socket/                # WebSocket setup
│   └── uploads/               # User uploads
├── client/
│   ├── index.html             # React app entry
│   ├── package.json           # React dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── src/                   # React source files
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with hot reload (nodemon) |
| `npm start` | Start without reload |
| `node --check server/server.js` | Check syntax |

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5000 already in use
Change `PORT` in `server/.env` to another port (e.g., 3000, 8000)

### MongoDB connection fails
- Check if MongoDB is running: `mongod`
- Verify `MONGO_URI` in `server/.env`
- For Atlas, ensure IP whitelist includes your address

### Frontend not loading
- Clear browser cache: `Ctrl+Shift+Delete`
- Check browser console for errors: `F12`
- Ensure backend is running on port 5000

## Test Users

After starting, create a few test accounts:
1. Open http://localhost:5000
2. Click "Sign up"
3. Create 2-3 test users
4. Use browser tabs/windows to test multi-user chat

## API Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/signup` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/users` | ✅ | Get all users |
| POST | `/api/messages/send` | ✅ | Send message |
| GET | `/api/messages/:userId` | ✅ | Get chat history |

## Next Steps

- Add typing indicators
- Implement message read receipts
- Add file upload support
- Deploy to Heroku/Vercel
- Add message search
- Implement group chats

## Support

For issues or questions, check the code comments or open an issue.
