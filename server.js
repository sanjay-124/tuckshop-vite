import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Use environment variables for Firebase configuration
const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://tuckshop-vite.vercel.app", "http://localhost:5173"],
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
    }).catch(error => {
      console.error('Error fetching items:', error);
      socket.emit('error', 'Failed to fetch items');
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
