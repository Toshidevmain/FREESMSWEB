const express = require('express');
const axios = require('axios');
const qs = require('qs');
const UserAgent = require('user-agents');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://toshidev0:zcode22107@dbtxt.3dxoaud.mongodb.net/?retryWrites=true&w=majority&appName=DBTXT', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const attackSchema = new mongoose.Schema({
  timestamp: String,
  number: String,
  message: String,
  response: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Attack = mongoose.model('Attack', attackSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function randomId() {
  return Array.from({ length: 16 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('');
}

function randomToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  return 'cLjBqxTHR8edNkAP7GG4R-:APA91b' + Array.from({ length: 152 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomModel() {
  const models = ['TECNO LH8n', 'Samsung Galaxy S21', 'iPhone 13 Pro', 'Google Pixel 6', 'Xiaomi Redmi Note 10', 'OnePlus 9', 'Huawei P40', 'Oppo Reno 5', 'Vivo V21', 'Realme 8 Pro'];
  return models[Math.floor(Math.random() * models.length)];
}

app.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body;

    if (!number || !/^(?:\+639|09|9)\d{9}$/.test(number)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const cleanNumber = number.replace(/^(\+63|0)/, '');
    const deviceId = randomId();
    const firebaseToken = randomToken();
    const deviceModel = randomModel();
    const userAgent = new UserAgent({ deviceCategory: 'mobile' }).toString();

    const data = qs.stringify({
      '$Oj0O%K7zi2j18E': `["free.text.sms","412","+63${cleanNumber}","${deviceModel}","${firebaseToken}","${message}-freed0m",""]`,
      device_id: deviceId,
      humottae: 'Processing'
    });

    const config = {
      method: 'POST',
      url: 'https://sms.m2techtronix.com/v13/sms.php',
      headers: {
        'User-Agent': userAgent,
        Connection: 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Charset': 'UTF-8'
      },
      data
    };

    const response = await axios.request(config);

    const log = {
      timestamp: new Date().toLocaleString(),
      number: `+63${cleanNumber}`,
      message,
      response: response.data
    };

    await Attack.create(log);
    io.emit('newAttack', log);

    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.response?.status || err.message,
      details: err.response?.data || null
    });
  }
});

app.get('/history', async (req, res) => {
  try {
    const logs = await Attack.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs.' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
