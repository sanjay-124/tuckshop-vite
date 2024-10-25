import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Update this path to where you actually stored your serviceAccountKey.json
const serviceAccountPath = join(__dirname, 'config', 'serviceAccountKey.json');

let serviceAccount;
try {
  const serviceAccountFile = await fs.readFile(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (error) {
  console.error('Error reading service account file:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tuckshop-2024-default-rtdb.firebaseio.com" // This URL can be found in your Firebase project settings
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tuckshop-vite.vercel.app", // Replace with your Vite dev server URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('updateItems', () => {
    const db = admin.database();
    const itemsRef = db.ref('items');

    itemsRef.once('value', (snapshot) => {
      const items = snapshot.val();
      if (items) {
        Object.entries(items).forEach(([id, item]) => {
          io.emit('itemUpdated', { id, ...item });
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});