import { ObjectId } from 'mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { AppModule } from '../app.module';
import { AuthGuard } from '../app.guard';
import { ExecutionContext, INestApplication, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { of } from 'rxjs';
import { Gender } from '../schemas/profile.schema';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Chat, ChatDocument } from '../schemas/chat.schema';
import * as request from 'supertest';
import { ChatService } from './chat.service';
import { SendChatDTO } from './dto/sendChat.dto';


describe('Chat (e2e)', () => {
  let app: INestApplication;
  let chatService: ChatService;
  let originalAuthGuard: AuthGuard;

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { sub: '672b158095429e9e9cf991a2' };
          return true;
        },
      })
      .overrideInterceptor(FileInterceptor('file'))
      .useValue({
        intercept: (context: ExecutionContext, next: any) => next.handle().pipe(of({})),
      })
      .compile();

    app = module.createNestApplication();
    originalAuthGuard = app.get<AuthGuard>(AuthGuard);
    await app.init();

    chatService = module.get<ChatService>(ChatService);

    //init db for testing
    const testing1 = await app.get<Model<UserDocument>>(getModelToken(User.name)).findById(
      {
        _id: new ObjectId('672a3b74b5b9659261f25c9e')
      },
    );

    const testing2 = await app.get<Model<UserDocument>>(getModelToken(User.name)).findById(
      {
        _id: new ObjectId('672b158095429e9e9cf991a2')
      },
    );

    if (testing1 == null) {
      await app.get<Model<UserDocument>>(getModelToken(User.name)).create({
        _id: new ObjectId('672a3b74b5b9659261f25c9e'),
        email: "test@example.com",
        username: "testUser",
        password: "password123",
        interest: [
          "coding",
          "music"
        ],
      })
    }

    if (testing2 == null) {
      await app.get<Model<UserDocument>>(getModelToken(User.name)).create({
        _id: new ObjectId('672b158095429e9e9cf991a2'),
        email: "test5@example.com",
        username: "testUsername5",
        interest: [
          "coding",
          "music"
        ],
        password: "password123",
        profile: {
          display_name: "John Doe",
          gender: Gender.M,
          birthday: "1990-01-01T00:00:00.000Z",
          height: 180,
          weight: 75,
        }
      })
    }

    const chatModel = app.get<Model<ChatDocument>>(getModelToken(Chat.name));

    const chatCount = await chatModel.countDocuments({
      sender: new ObjectId('672b158095429e9e9cf991a2'),
      receiver: new ObjectId('672a3b74b5b9659261f25c9e'),
    });

    if (chatCount == 0) {
      await chatModel.create({
        _id: new ObjectId("672dad6c42d843ba894484fc"),
        sender: new ObjectId('672b158095429e9e9cf991a2'),
        receiver: new ObjectId('672a3b74b5b9659261f25c9e'),
        message: 'Hello, how are you?',
      });
    }


  });

  afterAll(async () => {
    if (app) {
      const connection = app.get(getConnectionToken());

      await app.get<Model<Chat>>(getModelToken(Chat.name)).deleteMany({
        _id: {
          $ne: new ObjectId('672dad6c42d843ba894484fc')
        }
      });

      await connection.close();
      await app.close();
    }
  });

  describe("GET /api/chat/list-chat", () => {
    it("should return a list of chat messages", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/chat/list-chat")
        .expect(200)

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return an internal error", async () => {
      jest.spyOn(chatService, "getChatUsers").mockImplementationOnce(() => {
        throw new InternalServerErrorException("Internal server error")
      })

      const response = await request(app.getHttpServer())
        .get("/api/chat/list-chat")
        .expect(500)

      expect(response.body.message).toBe("Internal server error")
    })
  })

  describe("GET /api/chat/messages/:userId", () => {
    it("should return a list of messages between two users", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/chat/messages/672a3b74b5b9659261f25c9e")
        .expect(200)

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should return an empty array", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/chat/messages/672a3b74b5b9659261f25c9f")
        .expect(200)
      expect(response.body.data).toHaveLength(0)
    })

    it("should return an internal error", async () => {
      jest.spyOn(chatService, "getMessages").mockImplementationOnce(() => {
        throw new InternalServerErrorException("Internal server error")
      })

      const response = await request(app.getHttpServer())
        .get("/api/chat/messages/672a3b74b5b9659261f25c9e")
        .expect(500)

      expect(response.body.message).toBe("Internal server error")
    })
  });

  describe("POST /api/chat/sendMessage", () => {

    it("should send a message", async () => {

      const newMessage: SendChatDTO = {
        message: "Hello World",
        receiverId: "672a3b74b5b9659261f25c9e",
      }

      const response = await request(app.getHttpServer())
        .post("/api/chat/sendMessage")
        .send(newMessage)
        .expect(201)

      expect(response.body.data.message).toBe("Hello World")
    });

    it("should return an not found error, because Receiver not found", async () => {

      const newMessage: SendChatDTO = {
        message: "Hello World",
        receiverId: "672a3b74b5b9659261f25c9f",
      }

      const response = await request(app.getHttpServer())
        .post("/api/chat/sendMessage")
        .send(newMessage)
        .expect(404)

      expect(response.body.message).toBe("Receiver not found")

    })

    it("should return an not found error, because Sender not found", async () => {

      const newMessage: SendChatDTO = {
        message: "Hello World",
        receiverId: "672a3b74b5b9659261f25c9e",
      }

      jest.spyOn(originalAuthGuard, "canActivate").mockImplementationOnce(async (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { sub: '672b158095429e9e9cf991a1' };
        return true;
      
    })

      const response = await request(app.getHttpServer())
        .post("/api/chat/sendMessage")
        .send(newMessage)
        .expect(404)

      expect(response.body.message).toBe("Sender not found")

    })

    it("should return an internal error", async () => {

      jest.spyOn(chatService, "createMessage").mockImplementationOnce(() => {
        throw new InternalServerErrorException("Internal server error")
      })

      const newMessage: SendChatDTO = {
        message: "Hello World",
        receiverId: "672a3b74b5b9659261f25c9e",
      }

      const response = await request(app.getHttpServer())
        .post("/api/chat/sendMessage")
        .send(newMessage)
        .expect(500)

      expect(response.body.message).toBe("Internal server error")

    })

  })

  describe("PUT /api/chat/editMessage/:messageId", () => {

    it("should edit a message", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/chat/editMessage/672dad6c42d843ba894484fc")
        .send({ message: "Hello World 2" })
        .expect(200)

      expect(response.body.data.message).toBe("Hello World 2")
    })

    it("should return an error because cant find the message", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/chat/editMessage/672dad6c42d843ba894484f5")
        .send({ message: "Hello World 2" })
        .expect(404)

      expect(response.body.message).toBe("Message not found")
    })

    it("should return an internal error", async () => {
      jest.spyOn(chatService, "editMessage").mockImplementationOnce(() => {
        throw new InternalServerErrorException("Internal server error")
      })

      const response = await request(app.getHttpServer())
        .patch("/api/chat/editMessage/672dad6c42d843ba894484fc")
        .send({ message: "Hello World 2" })
        .expect(500)

      expect(response.body.message).toBe("Internal server error")
    })

  })

  describe("DELETE /api/chat/deleteMessage/:messageId", () => {

    it("should delete a message", async () => {
      const response = await request(app.getHttpServer())
        .delete("/api/chat/deleteMessage/672dad6c42d843ba894484fc")
        .expect(200)

      expect(response.body.data.is_deleted).toBe(true)

      await app.get<Model<Chat>>(getModelToken(Chat.name)).updateOne({
        _id : new ObjectId("672dad6c42d843ba894484fc")
      },
      {
        is_deleted: false
      });
    })

    it("should return an not found error when delete a message that has been already deleted", async () => {

      await app.get<Model<Chat>>(getModelToken(Chat.name)).updateOne({
        _id : new ObjectId("672dad6c42d843ba894484fc")
      },
      {
        is_deleted: true
      });

      const response = await request(app.getHttpServer())
        .delete("/api/chat/deleteMessage/672dad6c42d843ba894484fc")
        .expect(404)

      expect(response.body.message).toBe("Message Not Found")

      await app.get<Model<Chat>>(getModelToken(Chat.name)).updateOne({
        _id : new ObjectId("672dad6c42d843ba894484fc")
      },
      {
        is_deleted: false
      });
    })

    it("should return an error because cant find the message", async () => {
      const response = await request(app.getHttpServer())
        .delete("/api/chat/deleteMessage/672dad6c42d843ba894484f5")
        .expect(404)

      expect(response.body.message).toBe("Message not found")
    })

    it("should return an internal error", async () => {
      jest.spyOn(chatService, "deleteMessage").mockImplementationOnce(() => {
        throw new InternalServerErrorException("Internal server error")
      })

      const response = await request(app.getHttpServer())
        .delete("/api/chat/deleteMessage/672dad6c42d843ba894484fc")
        .expect(500)

      expect(response.body.message).toBe("Internal server error")
    })
  })

});
