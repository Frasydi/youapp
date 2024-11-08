import { Gender, Horoscope, Zodiac } from './schemas/profile.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

describe('App (e2e)', () => {
  let app: INestApplication;
  let appService: AppService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    appService = moduleFixture.get<AppService>(AppService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    //init db for testing
    const testing1 = await app.get<Model<UserDocument>>(getModelToken(User.name)).findById(
      {
        _id: new ObjectId('672a3b74b5b9659261f25c9e')
      },
    );



    if (testing1 == null) {
      await app.get<Model<UserDocument>>(getModelToken(User.name)).create({
        _id: new ObjectId('672a3b74b5b9659261f25c9e'),
        email: "test@example.com",
        username: "testuser",
        password: "password123",
        interest: [
          "coding",
          "music"
        ],
      })
    }

  }, 100000);

  afterAll(async () => {
    if (app) {
      await app.get<Model<UserDocument>>(getModelToken(User.name)).deleteMany({
        _id: {
          $nin: [new ObjectId('672a3b74b5b9659261f25c9e'), new ObjectId("672b158095429e9e9cf991a2")]
        }
      });
      const connection = app.get(getConnectionToken());
      await connection.close();
      await app.close();
    }
  }, 100000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/register', () => {

    it('should register a new user', async () => {
      const userRegisterDto = {
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/register')
        .send(userRegisterDto)
        .expect(201);

      expect(response.body.email).toBe(userRegisterDto.email);
      expect(response.body.username).toBe(userRegisterDto.username);
    });

    it('should return an error if registration fails', async () => {
      jest.spyOn(appService, 'register').mockImplementationOnce(() => {
        throw new InternalServerErrorException('Error registering user');
      });

      const userRegisterDto = {
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/register')
        .send(userRegisterDto)
        .expect(500);

      expect(response.body.message).toBe('Error registering user');
    });

    it('should return an error cause unique conflict', async () => {
      jest.setTimeout(100000);
      const userRegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/register')
        .send(userRegisterDto)
        .expect(409);

      expect(response.body.message).toBe('Duplicate key error: A user with this email or username already exists.');
    });
  });

  describe('POST /api/login', () => {
    it('should login a user and return an access token', async () => {
      const userLoginDto = {
        usernameEmail: 'testuser',
        password: 'password123',
      };

      jest.spyOn(appService, 'login').mockImplementationOnce(async () => ({
        accessToken: 'testToken',
        refreshToken: "refreshToken"
      }));

      const response = await request(app.getHttpServer())
        .post('/api/login')
        .send(userLoginDto)
        .expect(200);

      expect(response.body.accessToken).toBe('testToken');
    });

    it('should login a user from email and return an access token', async () => {
      const userLoginDto = {
        usernameEmail: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(appService, 'login').mockImplementationOnce(async () => ({
        accessToken: 'testToken',
        refreshToken: 'refreshToken'
      }));

      const response = await request(app.getHttpServer())
        .post('/api/login')
        .send(userLoginDto)
        .expect(200);

      expect(response.body.accessToken).toBe('testToken');
      expect(response.body.refreshToken).toBe('refreshToken');
    });

    it('should return an error if login fails', async () => {

      const userLoginDto = {
        usernameEmail: 'testuser',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/login')
        .send(userLoginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');

    })

  });

  describe('GET /api/refresh-token', () => {
    it('should return a new refresh token and access token', async () => {
      const token = {
        accessToken: "testToken",
        refreshToken: "refreshToken"
      }

      jest.spyOn(appService, 'refreshToken').mockImplementationOnce(async () => {
        return {
          accessToken: "newToken",
          refreshToken: "newRefresh"
        }
      });

      const response = await request(app.getHttpServer())
        .post("/api/refresh-token")
        .set('x-refresh-token', `${token.refreshToken}`)
        .expect(200);

      expect(response.body).toEqual({
        accessToken: "newToken",
        refreshToken: "newRefresh"
      });
    })

    it('should return an error if refresh token is missing', async () => {
      const response = await request(app.getHttpServer()).post("/api/refresh-token").expect(401)
      expect(response.body.message).toBe('Refresh token not found')
    })

    it('should return an error if refresh token is invalid', async () => {
      jest.spyOn(appService, 'refreshToken').mockImplementationOnce(async () => {
        throw new UnauthorizedException('Invalid or expired refresh token')
      })

      const token = {
        refreshToken: "invalidToken"
      }

      const response = await request(app.getHttpServer()).post("/api/refresh-token").set('x-refresh-token', `${token.refreshToken}`).expect(401)
      expect(response.body.message).toBe('Invalid or expired refresh token')
    })

    it('should return an error if there is an internal server error', async () => {
      jest.spyOn(appService, 'refreshToken').mockImplementationOnce(async () => {
        throw new InternalServerErrorException('Internal Server Error')
      })

      const token = {
        refreshToken: "refreshToken"
      }

      const response = await request(app.getHttpServer()).post("/api/refresh-token").set('x-refresh-token', `${token.refreshToken}`).expect(500)
      expect(response.body.message).toBe('Internal Server Error')
    })
  })

  describe('GET /api/auth', () => {

    it('should return user data if authenticated', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        username: 'test',
        password: 'hashedpassword',
        interest: ['coding'],
        profile: {
          user: '1',
          display_name: 'Test User',
          gender: Gender.M,
          birthday: new Date('1990-01-01'),
          horoscope: Horoscope.Capricorn,
          zodiac: Zodiac.Dragon,
          height: 180,
          weight: 75,
          image_url: 'http://example.com/image.jpg'
        }
      };


      jest.spyOn(appService, 'validateUser').mockImplementationOnce(async () => {
        const { password, ...newUser } = user
        return { ...newUser }
      });

      const token = jwtService.sign({ username: user.username, sub: user._id });

      const response = await request(app.getHttpServer())
        .get('/api/auth')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        _id: user._id,
        username: user.username,
        email: user.email,
        interest: user.interest,
        profile: {
          ...user.profile,
          birthday: user.profile.birthday.toISOString()
        },

      });
    });

    it('should return an error if not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth')
        .expect(401);

      expect(response.body.message).toBe('You do not have access');
    });
  });

})
