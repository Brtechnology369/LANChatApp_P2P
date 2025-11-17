// Koyeb Compatible WebSocket Server for Multi-User Real-Time Chat

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New client connected. Total clients:', clients.size);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      for (let client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ username: data.username, message: data.message }));
        }
      }
    } catch (err) {
      console.error('Invalid message format', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Multi-user WebSocket chat server running on port ${PORT}`);
});