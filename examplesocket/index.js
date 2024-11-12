/** @type {import("socket.io-client")} */
const io = require('socket.io-client');

// Connect to the WebSocket server
const socket = io('http://localhost:3050', {
    query : {
        token : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoiNjcyYTNiNzRiNWI5NjU5MjYxZjI1YzllIiwiaWF0IjoxNzMxMzg1NzkwLCJleHAiOjE3MzEzODY2OTB9.FH0aRoQ1gaOFTocLrJDJuiNpwc9FrSnhpTftHLNza98"
    }
});

const socket2 = io('http://localhost:3050', {
    query : {
        token : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RVc2VybmFtZTUiLCJzdWIiOiI2NzJiMTU4MDk1NDI5ZTllOWNmOTkxYTIiLCJpYXQiOjE3MzEzODYwMzIsImV4cCI6MTczMTM4NjkzMn0.IMbla4NI9WHiThyCcm0AT64Bn2-SYatfmYUugjgug3Y"
    }
});

// Event listener for connection
socket.on('connect', () => {
  console.log('Connected to server');

  // Example of sending a message
  socket.emit('upsertMessage', {receiverId : '672b158095429e9e9cf991a2', data : {
    type: 'send',
    data: {
      sender: '672a3b74b5b9659261f25c9e',
      receiver: '672b158095429e9e9cf991a2',
      message: 'Hello, this is a test message',
      timestamp: new Date(),
      read: false,
      is_deleted: false
    }
  }});

  // Example of deleting a message
  socket.emit('upsertMessage', {receiverId : '672b158095429e9e9cf991a2', data : {
    type: 'delete',
    data: 'messageId'
  }});

  // Example of updating a message
  socket.emit('upsertMessage', {receiverId : 'receiverUserId', data : {
    type: 'update',
    data: {
      id: 'messageId',
      chat: {
        sender: 'senderUserId',
        receiver: 'receiverUserId',
        message: 'Updated message content',
        timestamp: new Date(),
        read: false,
        is_deleted: false
      }
    }
  }});
});

// Event listener for receiving messages
socket2.on('messageUpsert', (userId, data) => {
  console.log(`Message upsert from user ${userId}:`, data);
});

// Event listener for status updates
socket2.on('statusUpdated', (userId, status) => {
  console.log(`Status updated for user ${userId}: ${status}`);
});

// Event listener for disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket2.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on("error", (err) => {
    console.log(err)
})