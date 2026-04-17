# Quick Start Guide

## Problem Fixed
✅ Frontend dependencies were missing - now installed!

## Running the Chat App

### Terminal 1 (Backend)
```bash
cd /Users/anushka/Chat_App
npm run dev
```
Output should show:
```
Server running on port 5000
MongoDB Connected
```

### Terminal 2 (Frontend)
```bash
cd /Users/anushka/Chat_App/client
npm run dev
```
Output should show:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser
Go to **http://localhost:5173**

---

## What to Expect

1. **Login/Sign Up Screen** - Create a test account
2. **Contacts List** - Shows all registered users
3. **Real-time Chat** - Click a contact and start messaging
4. **Online Status** - See who's online/offline
5. **Typing Indicator** - Shows when someone is typing

---

## Testing Multi-User Chat

1. Open http://localhost:5173 in **Browser Tab 1**
   - Sign up as "User1"
   
2. Open http://localhost:5173 in **Browser Tab 2** (or private window)
   - Sign up as "User2"
   
3. Send messages between tabs - instant delivery!

---

## Backend Port Issues?

If port 5000 is already in use, change in `server/.env`:
```
PORT=3000
```

Then connect frontend to the new port in browser.

---

## Need Help?

- Check browser console: `F12` → Console tab
- Check terminal for errors
- Ensure MongoDB is running locally
- Make sure `.env` file exists with proper values
