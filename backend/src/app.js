require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./db/database');
const roomsRouter = require('./routes/rooms');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const setupWebSocket = require('./websocket/handler');
const cookieParser = require('cookie-parser')

/*
Start out APU stuff

```
- express() creates your app — like the Spring Boot `Application` class
- http.createServer(app) wraps Express in a raw Node HTTP server — **we need this later to attach WebSockets**, since WebSockets upgrade from HTTP
- app.use() registers **middleware** — like Spring filter chain. Order matters, top to bottom
- cors() — allows your React frontend (port 5173) to call your backend (port 3000). Browsers block cross-origin requests by default
- express.json() — parses incoming JSON request bodies, like `@RequestBody` support
- '/api/rooms' — prefixes all routes in `roomsRouter`, so `router.get('/')` becomes `GET /api/rooms`

---
 */
const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: [
        'https://sensational-lolly-33ea3c.netlify.app',
        'https://6a15d63d3d76ee359c419801--sensational-lolly-33ea3c.netlify.app'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());
app.use(cookieParser())

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/user', userRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'Holonet online' });
});

const PORT = process.env.PORT || 3000;

connectDB().then(async () => {
    const Room = require('./models/Room');

    const defaultRooms = [
        { name: 'Cantina',            description: 'Open to all factions. Keep it civil.', faction: 'Neutral' },
        { name: 'Rebel Alliance HQ',  description: 'Rebel operatives only.',               faction: 'Rebel Alliance' },
        { name: 'Imperial Command',   description: 'Long live the Empire.',                faction: 'Galactic Empire' },
        { name: 'Mandalorian Covert', description: 'This is the way.',                     faction: 'Mandalorian' },
        { name: 'Jedi Archives',      description: 'Knowledge and wisdom of the Order.',   faction: 'Jedi Order' },
    ];
/*
Incase a room was deleted, we update/ recreate it, otherwise its just a safe pattern of ensuring the rooms are there
 */
    for (const room of defaultRooms) {
        await Room.findOneAndUpdate(
            { name: room.name },
            {
                $setOnInsert: { //Brilliant work mr Kojima, fki g hell I forgot I had an udpate statemtne hehere aaaaaaa
                    description: room.description,
                    faction: room.faction,
                    members: [],
                }
            },
            { upsert: true }
        );
    }

    setupWebSocket(server);

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});