let socket;
let username;
let selectedRecipient = null;
let typingTimeout;

function connectToServer() {
    username = document.getElementById("username").value.trim();
    if (username === "") {
        alert("Please enter a username.");
        return;
    }

    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
        socket.send(JSON.stringify({ type: "connect", username }));
        document.getElementById("user-login").style.display = "none";
        document.getElementById("chat-area").style.display = "flex";
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
            displayMessage(data.sender, data.message, data.sender === username, data.timestamp);
            if (data.sender !== username) {
                socket.send(JSON.stringify({ type: "seen", sender: username, recipient: data.sender }));
            }
        } else if (data.type === "updateUsers") {
            updateUserList(data.users);
        } else if (data.type === "typing") {
            document.getElementById("typing-status").innerText = `${data.sender} is typing...`;
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                document.getElementById("typing-status").innerText = "";
            }, 2000);
        } else if (data.type === "seen") {
            document.getElementById("read-status").innerText = `Seen at ${data.timestamp}`;
        }
    };
}

function sendMessage() {
    if (!selectedRecipient) {
        alert("Please select a user to chat with.");
        return;
    }

    const message = document.getElementById("message").value.trim();
    if (message === "") {
        alert("Message cannot be empty.");
        return;
    }

    const messageData = {
        type: "message",
        sender: username,
        recipient: selectedRecipient,
        message,
    };

    socket.send(JSON.stringify(messageData));
    displayMessage(username, message, true, new Date().toLocaleString());
    document.getElementById("message").value = "";
}

function displayMessage(sender, message, isSelf, timestamp) {
    let chatBox = document.getElementById("chat-box");
    let messageElement = document.createElement("div");
    messageElement.classList.add("chat-message", isSelf ? "sender" : "receiver");
    messageElement.innerHTML = `<strong>${isSelf ? "You" : sender}:</strong> ${message} <br><small>${timestamp}</small>`;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function updateUserList(users) {
    let userList = document.getElementById("user-list");
    userList.innerHTML = "";

    users.forEach(user => {
        if (user !== username) {
            let userElement = document.createElement("div");
            userElement.textContent = user;
            userElement.classList.add("user-item");
            userElement.onclick = () => selectRecipient(user, userElement);

            userList.appendChild(userElement);
        }
    });
}

function selectRecipient(user, element) {
    selectedRecipient = user;
    document.querySelectorAll(".user-item").forEach(item => item.classList.remove("selected"));
    element.classList.add("selected");
}
