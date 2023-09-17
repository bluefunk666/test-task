const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');


const app = express();
const port = 3000;

// хттп сервер
const server = http.createServer(app);
const io = socketIo(server);

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

app.use(express.json());

app.use(express.static(path.join(__dirname + '/')));

io.on('connection', (socket) => {
    console.log('Новое соединение WebSocket');

    // обработка сообщений от клиента
    socket.on('message', async (message) => {
        console.log('Получено сообщение:', message);

        // всем клиентам отправляются сообщения
        io.emit('message', message);

        // сейв в базу данных
        try {
            const client = await pool.connect();
            await client.query('INSERT INTO chat_messages (message) VALUES ($1)', [message]);
            client.release();
        } catch (err) {
            console.error('Ошибка при сохранении сообщения в базе данных:', err);
        }
    });

    // отключение
    socket.on('disconnect', () => {
        console.log('WebSocket соединение разорвано');
    });
});

// обработчик дляполучения сообщений из базы данных
app.get('/messages', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM chat_messages ORDER BY timestamp');
        const messages = result.rows;
        client.release();
        res.json(messages);
    } catch (err) {
        console.error('Ошибка при получении сообщений из базы данных:', err);
        res.status(500).json({ error: 'Произошла ошибка при получении сообщений' });
    }
});

// обработчик для отправки сообщения в базу данных
app.post('/messages', async (req, res) => {
    try {
        const { text } = req.body;
        const client = await pool.connect();
        const result = await client.query('INSERT INTO chat_messages (message) VALUES ($1) RETURNING *', [text]);
        const newMessage = result.rows[0];
        client.release();
        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Ошибка при сохранении сообщения в базе данных:', err);
        res.status(500).json({ error: 'Произошла ошибка при сохранении сообщения' });
    }
});

// обработчик для корня папки
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

server.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
