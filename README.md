
# Description

This is [YouApp] Backend

# Project setup

```bash
$ npm install
$ docker-compose up -d
```

# For Testing

```bash
$ npm run test
```

# Project Structure
```bash
.dockerignore
.env
.eslintrc.js
.gitignore
.prettierrc
docker-compose.dev.yml
docker-compose.yml
Dockerfile
Dockerfile.dev
examplefile/
examplesocket/
    index.js
    package.json
nest-cli.json
package.json
README.md
src/
    app.controller.ts
    app.e2e.spec.ts
    app.guard.ts
    app.module.ts
    app.service.ts
    chat/
        chat.controller.ts
        chat.e2e.spec.ts
        chat.gateway.ts
        chat.module.ts
        chat.service.ts
    dto/
    main.ts
    schemas/
        chat.schema.ts
        profile.schema.ts
        user.schema.ts
    shared.module.ts
    test/
        ...
    types/
        customRequest.ts
        error.ts
        user.ts
    user/
        user.controller.ts
        user.e2e.spec.ts
        user.module.ts
        user.service.ts
    utils/
        createFile.ts
        deleteFile.ts
tsconfig.build.json
tsconfig.json
uploads/
```
# Environment Variables
Create a '.env' file in the root directory and add the following environment variables:

```
MONGO_URI=mongodb://mongo:27017/nest-db
REDIS_URL=redis://redis:6379
SECRET_KEY=your_secret_key
```

# Docker

## Build Docker Image

```bash
$ docker build -t youapp .
```

```bash
$ docker-compose up -d
```

# API Documentation
The API documentation is available at /api-docs once the application is running.

# Running the Application
## Development

```bash 
$ npm run start:dev
```
## Production
```bash
$ npm run build
$ npm run start:prod
```

# Testing
## Unit Tests
```bash
$ npm run test
```

# Key Files and Directories

- main.ts: Entry point of the application.
- app.module.ts: Main application module.
- app.controller.ts: Main application controller.
- app.service.ts: Main application service.
- app.guard.ts: Authentication guard.
- shared.module.ts: Shared module for common services and schemas.
- user: User-related modules, controllers, services, and DTOs.
- chat: Chat-related modules, controllers, services, and DTOs.
- schemas: Mongoose schemas for User, Profile, and Chat.
- utils: Utility functions for file handling.
- types: Custom types and decorators.

# WebSocket
The WebSocket server runs on port 3050. The ChatGateway handles WebSocket connections and events.

## Example Socket

The `examplesocket/index.js` file demonstrates how to connect to the WebSocket server and perform various actions such as sending, updating, and deleting messages.

### Connecting to the WebSocket Server

```javascript
const io = require('socket.io-client');

// Connect to the WebSocket server
const socket = io('http://localhost:3050', {
    query : {
        token : "your_jwt_token"
    }
});
```

### Sending a Message

```javascript
socket.emit('upsertMessage', {receiverId : 'receiverUserId', data : {
    type: 'send',
    data: {
        sender: 'senderUserId',
        receiver: 'receiverUserId',
        message: 'Hello, this is a test message',
        timestamp: new Date(),
        read: false,
        is_deleted: false
    }
}});
```

### Deleting a Message

```javascript
socket.emit('upsertMessage', {receiverId : 'receiverUserId', data : {
    type: 'delete',
    data: 'messageId'
}});
```

### Updating a Message

```javascript
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
```

### Receiving Messages

```javascript
socket.on('messageUpsert', (userId, data) => {
    console.log(`Message upsert from user ${userId}:`, data);
});
```

### Status Updates

```javascript
socket.on('statusUpdated', (userId, status) => {
    console.log(`Status updated for user ${userId}: ${status}`);
});
```

### Disconnection

```javascript
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
```

# Notes
- Ensure MongoDB and Redis are running before starting the application.
- Use docker-compose.dev.yml for development with Docker.
- Use docker-compose.yml for production with Docker.