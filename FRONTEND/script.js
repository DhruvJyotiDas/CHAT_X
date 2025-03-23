let socket;
let username;
let selectedRecipient = null;
let typingTimeout;

// Store chat history for each user, including profile pics
let chatHistory = {};
let userProfiles = {};

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
            storeMessage(data.sender, data.recipient, data.message, data.timestamp, data.profilePic);
            if (data.sender !== username) {
                socket.send(JSON.stringify({ type: "seen", sender: username, recipient: data.sender }));
            }
        } else if (data.type === "updateUsers") {
            updateUserList(data.users);
        } else if (data.type === "typing") {
            if (selectedRecipient === data.sender) {
                document.getElementById("typing-status").innerText = `${data.sender} is typing...`;
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    document.getElementById("typing-status").innerText = "";
                }, 2000);
            }
        } else if (data.type === "seen") {
            document.getElementById("read-status").innerText = `Seen at ${data.timestamp}`;
        }
    };
}

// Store messages in chat history with profile pics
function storeMessage(sender, recipient, message, timestamp, profilePic) {
    const chatKey = sender === username ? recipient : sender;
    
    if (!chatHistory[chatKey]) {
        chatHistory[chatKey] = [];
    }
    
    chatHistory[chatKey].push({ sender, message, timestamp, profilePic });

    if (!userProfiles[sender]) {
        userProfiles[sender] = profilePic || "/Users/rishabhsinghparmar/Downloads/WhatsApp Image 2025-03-14 at 13.12.49.jpeg";
    }

    if (selectedRecipient === chatKey) {
        displayMessages(chatKey);
    }
}

// Send message
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

    const timestamp = new Date().toLocaleString();
    const messageData = {
        type: "message",
        sender: username,
        recipient: selectedRecipient,
        message,
        timestamp,
        profilePic: userProfiles[username] || "/Users/rishabhsinghparmar/Downloads/WhatsApp Image 2025-03-14 at 13.12.49.jpeg"
    };

    storeMessage(username, selectedRecipient, message, timestamp, messageData.profilePic);
    socket.send(JSON.stringify(messageData));

    document.getElementById("message").value = "";
}

// Display messages with recent ones first
function displayMessages(user) {
    let chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";

    if (chatHistory[user]) {
        // Reverse the array to show newest messages first
        const reversedMessages = [...chatHistory[user]].reverse();
        reversedMessages.forEach(({ sender, message, timestamp, profilePic }) => {
            let messageElement = document.createElement("div");
            messageElement.classList.add("chat-message", sender === username ? "sender" : "receiver");
            
            let img = document.createElement("img");
            img.src = profilePic || userProfiles[sender] || "/Users/rishabhsinghparmar/Downloads/WhatsApp Image 2025-03-14 at 13.12.49.jpeg";
            img.classList.add("profile-pic");
            
            let content = document.createElement("div");
            content.innerHTML = `<strong>${sender === username ? "You" : sender}:</strong> ${message} <br><small>${timestamp}</small>`;
            
            messageElement.appendChild(img);
            messageElement.appendChild(content);
            chatBox.appendChild(messageElement);
        });
    }

    // Scroll to the top where the newest messages are
    chatBox.scrollTop = 0;
}

// Update user list with profile pics
function updateUserList(users) {
    let userList = document.getElementById("user-list");
    userList.innerHTML = "";

    users.forEach(userData => {
        let user = typeof userData === "string" ? userData : userData.username;
        let profilePic = typeof userData === "object" ? userData.profilePic : userProfiles[user];
        
        if (user !== username) {
            if (!userProfiles[user]) {
                userProfiles[user] = profilePic || "/Users/rishabhsinghparmar/Downloads/WhatsApp Image 2025-03-14 at 13.12.49.jpeg";
            }

            let userElement = document.createElement("div");
            userElement.classList.add("user-item");

            let img = document.createElement("img");
            img.src = userProfiles[user];
            img.classList.add("profile-pic");

            let nameSpan = document.createElement("span");
            nameSpan.textContent = user;

            userElement.appendChild(img);
            userElement.appendChild(nameSpan);
            userElement.onclick = () => selectRecipient(user, userElement);

            userList.appendChild(userElement);
        }
    });
}

// Select recipient and load their chat
function selectRecipient(user, element) {
    selectedRecipient = user;
    
    document.querySelectorAll(".user-item").forEach(item => item.classList.remove("selected"));
    element.classList.add("selected");

    displayMessages(user);
}