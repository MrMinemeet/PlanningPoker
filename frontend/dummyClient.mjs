// test-client.mjs
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connection', () => {
  console.log('Connected to server with ID:', socket.id);
  socket.emit('joinRoom', '5c24eaa7d80366188b2e4a6a28924a9bd3d2b2cd54fde7b8e67cc1fef422b0bd',
    "0d23a11e9e6e62a441a4e06bdd4a9a7d0c4c18251a6cfdd7ae3038fcf74b4a0a");
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
