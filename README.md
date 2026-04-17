## Chat_App

This repository contains a Node.js + Express chat backend and a React frontend.

### Setup
1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGO_URI`, `JWT_SECRET`, and `PORT`.
3. Install dependencies:
	```bash
	npm install
	cd client && npm install
	```
4. Start the server:
	```bash
	npm run dev
	```

### Frontend
For the React client, run from the `client` folder:
```bash
cd client
npm run dev
```

### Use
Open `http://localhost:5173` in your browser while developing the React client.
If you build the frontend for production, open `http://localhost:5000` instead.

### API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users`
- `POST /api/messages/send`
- `GET /api/messages/:userId`
  
