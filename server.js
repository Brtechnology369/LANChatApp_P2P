// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'messages.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

let messages = [];
if (fs.existsSync(DATA_FILE)) {
  try { messages = JSON.parse(fs.readFileSync(DATA_FILE)); } catch(e){ messages = []; }
}
function saveMessages(){ fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2)); }

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/api/messages', (req, res) => res.json(messages));

app.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  const msg = {
    username: req.body.username || 'Anonymous',
    text: req.file.originalname,
    file: fileUrl,
    timestamp: new Date().toLocaleTimeString()
  };
  messages.push(msg);
  saveMessages();
  io.emit('chat message', msg);
  res.json({ success: true, url: fileUrl });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    socket.to(room).emit('peer-joined', socket.id);
  });

  socket.on('chat message', (data) => {
    const msg = {
      username: data.username || 'Anonymous',
      text: data.text,
      timestamp: new Date().toLocaleTimeString()
    };
    messages.push(msg);
    saveMessages();
    io.emit('chat message', msg);
  });

  socket.on('webrtc-offer', ({ room, offer, to }) => {
    if (to) socket.to(to).emit('webrtc-offer', { from: socket.id, offer });
    else socket.to(room).emit('webrtc-offer', { from: socket.id, offer });
  });

  socket.on('webrtc-answer', ({ room, answer, to }) => {
    if (to) socket.to(to).emit('webrtc-answer', { from: socket.id, answer });
    else socket.to(room).emit('webrtc-answer', { from: socket.id, answer });
  });

  socket.on('webrtc-ice', ({ room, candidate, to }) => {
    if (to) socket.to(to).emit('webrtc-ice', { from: socket.id, candidate });
    else socket.to(room).emit('webrtc-ice', { from: socket.id, candidate });
  });

  socket.on('delete message', (index) => {
    if (messages[index]) {
      if (messages[index].file) {
        const fpath = path.join(__dirname, 'public', messages[index].file.replace(/^\//,''));
        try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch(e){}
      }
      messages.splice(index,1);
      saveMessages();
      io.emit('delete message', index);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
