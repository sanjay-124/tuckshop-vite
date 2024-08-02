const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./path/to/serviceAccountKey.json'); // Download this from your Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-database-name>.firebaseio.com"
});

const db = admin.firestore();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite app URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

db.collection('items').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'modified') {
      io.emit('itemUpdate', {
        id: change.doc.id,
        ...change.doc.data()
      });
    }
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
