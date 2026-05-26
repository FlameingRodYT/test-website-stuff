    const WebSocket = require('ws');
    const jwt = require('jsonwebtoken');
    const Message = require('../models/Message');
    const Room = require('../models/Room');

const clients = new Map(); //our client conenction information is stored here

    function heartbeat() {
        this.isAlive = true;
    }

    //Function used for broadcasting presence
    function broadcastPresence(wss) {

        //Checkfs for all active clients
        const activeInRoom = [...wss.clients].filter(
            client => client.readyState === WebSocket.OPEN
        );

        const removeDuplicates = [...new Set(activeInRoom)];

        //Our payload send if a user is active
        const payload = JSON.stringify({
            type: 'presence',
            users: removeDuplicates.map(c => ({
                userId: c.userId,
                username: c.username,
                faction: c.faction,
            }))
        });

        //Send it to all clients on the ws
        activeInRoom.forEach(client => client.send(payload));
    }


const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ port: 8080 });

    wss.on('connection', async (ws, req) => {

        //Before anything WE PING PONG
        ws.isAlive = true;
        ws.on('pong', heartbeat);
        ws.authenticated = false;


        const authTimeout = setTimeout(() => {
            if (!ws.authenticated) ws.close(1008, 'Auth timeout');
        }, 5000);

        //Incoming message from client
        /*
        Once user sends a message it creates it and obviously it gets displayed on the Interface in our case in the Chat.jsx
         */
        ws.on('message', async (data) => {

            try {
                const parsed = JSON.parse(data);

                //Authenticate our webscoket
                //This sort of prevents the man in the middle attacks
                //Technically if auser does not confirmed to eb logged in it shouldnt be able to join the webscoket
                if (!ws.authenticated) {
                    if (parsed.type !== 'auth') {
                        ws.close(1008, 'Authenticate first');
                        return;
                    }
                    try {
                        //grab the user data
                        const user = jwt.verify(parsed.token, process.env.JWT_SECRET);
                        ws.userId = user._id;
                        ws.username = user.username;
                        ws.faction = user.faction;
                        ws.authenticated = true;
                        clearTimeout(authTimeout);
                        clients.set(ws, user);
                        console.log(`${user.username} connected`);
                        broadcastPresence(wss);
                    } catch {
                        ws.close(1008, 'Invalid token');
                    }
                    return; //Dont do anything until new message
                }

                const clientData = clients.get(ws);
                if (parsed.type === 'join') {

                    const room = await Room.findById(parsed.roomId);
                    if (!room) return;

                    //we set the client data and the room the client is in
                    clients.set(ws, {...clientData, roomId: room._id.toString() });

                    //we send the message history of this chat
                    const history = await Message.find({ roomId: room._id })
                        .sort({ createdAt: -1 })
                        .limit(50);

                    //the data we send via websocket needs to be sent raw as our websocket can only process it thatway
                    ws.send(JSON.stringify({
                        type: 'history',
                        messages: history.reverse(),
                        roomId: room._id.toString()
                    }));

                    console.log(`${clientData.username} joined #${room.name}`);
                }
                else if (parsed.type === 'message') {
                    const user = clients.get(ws);
                    if (!user?.roomId) return; //can't send without joining a room first


                    const message = await Message.create({
                        roomId: user.roomId,
                        username: user.username,
                        faction: user.faction,
                        content: parsed.content
                    });

                    //Broadcast only to clients in the same room
                    const payload = JSON.stringify({ type: 'message', message });
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            const clientRoom = clients.get(client)?.roomId;
                            if (clientRoom === user.roomId) {
                                client.send(payload);
                            }
                        }
                    });
                }
                //This is technically our 3rd messag type and we check for 2 things
                else if (parsed.type === 'typing' || parsed.type === 'stopTyping') {
                    const user = clients.get(ws);
                    //We get all the clients but are concerned only wiht those that are actualyl in the same room
                    if (!user?.roomId) return;

                    //Broadcast to everyone in the same room EXCEPT the sender
                    const payload = JSON.stringify({
                        type: parsed.type,       //this is exACTLY OUR VALUES EWE SEND
                        username: user.username,
                        roomId: user.roomId
                    });
                    //hERE WE SEND the clients the messahe
                    wss.clients.forEach(client => {
                        //cleint != ws -> this is exactly the line that excöudes us the typer
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            const clientRoom = clients.get(client)?.roomId;
                            if (clientRoom === user.roomId) {
                                client.send(payload);
                            }
                        }
                    });
                }

            } catch (err) {
                console.error('WS error:', err.message);
            }
        });

        /*
        When suer disconnects we remov eit form the client list
         */
        ws.on('close', () => {
            const user = clients.get(ws);
            console.log(`${user?.username} disconnected`);
            clients.delete(ws);
            broadcastPresence(wss);
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
};

module.exports = setupWebSocket;