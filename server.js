const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = {}; // Stores active users and their sockets

app.use(express.static(path.join(__dirname, "FRONTEND")));

wss.on("connection", (ws) => {
    let username = null;

    ws.on("message", (data) => {
        const message = JSON.parse(data);

        if (message.type === "connect") {
            username = message.username;
            clients[username] = ws;
            console.log(`${username} connected.`);
            broadcastUserList();
        } else if (message.type === "message") {
            const recipientSocket = clients[message.recipient];
            const timestamp = new Date().toLocaleString();

            const messageData = {
                type: "message",
                sender: message.sender,
                message: message.message,
                timestamp
            };

            if (recipientSocket) {
                recipientSocket.send(JSON.stringify(messageData));
            }

            ws.send(JSON.stringify(messageData));
        } else if (message.type === "typing") {
            if (clients[message.recipient]) {
                clients[message.recipient].send(JSON.stringify({ type: "typing", sender: message.sender }));
            }
        } else if (message.type === "seen") {
            if (clients[message.sender]) {
                clients[message.sender].send(JSON.stringify({ type: "seen", recipient: message.recipient, timestamp: new Date().toLocaleTimeString() }));
            }
        }
    });

    ws.on("close", () => {
        if (username && clients[username]) {
            console.log(`${username} disconnected.`);
            delete clients[username];
            broadcastUserList(); // Update user list when someone leaves
        }
    });
});

// Function to broadcast the updated list of online users
function broadcastUserList() {
    const users = Object.keys(clients);
    for (let user in clients) {
        clients[user].send(JSON.stringify({ type: "updateUsers", users }));
    }
}

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));