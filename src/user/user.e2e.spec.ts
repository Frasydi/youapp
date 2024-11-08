import { ObjectId } from 'mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProfileUpsertDto } from './dto/profileupsert.dto';
import { AuthGuard } from '../app.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { of } from 'rxjs';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Gender, Profile, ProfileDocument } from '../schemas/profile.schema';
import { UserModule } from './user.module';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

describe('User (e2e)', () => {
    let app: INestApplication;
    let userService: UserService;
    let originalAuthGuard: AuthGuard;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const request = context.switchToHttp().getRequest();
                    request.user = { sub: new ObjectId('672b158095429e9e9cf991a2') };
                    return true;
                },
            })
            .overrideInterceptor(FileInterceptor('file'))
            .useValue({
                intercept: (context: ExecutionContext, next: any) => next.handle().pipe(of({})),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        originalAuthGuard = app.get<AuthGuard>(AuthGuard);
        await app.init();

        userService = moduleFixture.get<UserService>(UserService);


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
    });

    afterAll(async () => {
        if (app) {
            await app.get<Model<UserDocument>>(getModelToken(User.name)).updateOne(
                {
                    _id: new ObjectId('672a3b74b5b9659261f25c9e')
                },
                {
                    $unset: {
                        profile: ""
                    }
                }
            );
            const connection = app.get(getConnectionToken());
            await connection.close();
            await app.close();
        }
    });

    describe('GET /api/user/profile', () => {


        it('should retrieve the profile of the authenticated user', async () => {

            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .expect(200);

            expect(response.body.data).toHaveProperty('display_name');

        });

        it('should return an error if the profile is not found', async () => {
            jest.spyOn(userService, 'getProfile').mockImplementationOnce(() => {
                throw new InternalServerErrorException("Profile not found")
            });

            const response = await request(app.getHttpServer())
                .get('/api/user/profile')
                .expect(500);

            expect(response.body.message).toBe('Profile not found');
        });
    });

    describe('GET /api/user/profile/:id', () => {

        it('should retrieve the profile by ID', async () => {

            const response = await request(app.getHttpServer())
                .get('/api/user/profile/672b158095429e9e9cf991a2')
                .expect(200);

            expect(response.body.data).toHaveProperty('display_name');


        });

        it('should return an error if the profile is not found by ID', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile/' + new ObjectId("672a3b74b5b9659261f25c92"))
                .expect(404);

            expect(response.body.message).toBe('Profile not found for this user');
        });
    });

    describe('GET /api/user/profile/:id/image', () => {
        it('should retrieve the profile image by ID', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/user/profile/672b158095429e9e9cf991a2/image`)
                .expect(200);

            expect(response.headers['content-type']).toBe('image/webp');
        });

        it('should return an error if the profile image is not found by ID', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user/profile/672a3b74b5b9659261f25c92/image')
                .expect(404);

            expect(response.body.message).toBe('Profile image not found for this user');
        });
    });

    describe('POST /api/user/profile', () => {
        it('should create a new profile', async () => {

            jest.spyOn(originalAuthGuard, "canActivate").mockImplementationOnce(async (context: ExecutionContext) => {
                const request = context.switchToHttp().getRequest();
                request.user = { sub: new ObjectId('672a3b74b5b9659261f25c9e') };
                return true;
            })
          
            const profileDto: ProfileUpsertDto = {
                display_name: 'Test User',
                gender: Gender.M,
                birthday: new Date('1990-01-01'),
                height: 180,
                weight: 75,
            };

            const response = await request(app.getHttpServer())
                .post('/api/user/profile')
                .send(profileDto)
                .expect(201);
            expect(response.body.data.display_name).toBe(profileDto.display_name);

        });

        it('should return an error if profile creation fails', async () => {
            const profileDto: ProfileUpsertDto = {
                display_name: 'Test User',
                gender: Gender.M,
                birthday: new Date('1990-01-01'),
                height: 180,
                weight: 75,
            };

            jest.spyOn(userService, 'upsertProfile').mockImplementationOnce(() => {
                throw new InternalServerErrorException("Internal server error")
            });

            const response = await request(app.getHttpServer())
                .post('/api/user/profile')
                .send(profileDto)
                .expect(500);

            expect(response.body.message).toBe('Internal server error');
        });

        it('should return an error cause duplicate profile from same user', async () => {
            const profileDto: ProfileUpsertDto = {
                display_name: 'Test User',
                gender: Gender.M,
                birthday: new Date('1990-01-01'),
                height: 180,
                weight: 75,
            };

            const response = await request(app.getHttpServer())
                .post('/api/user/profile')
                .send(profileDto)
                .expect(409);

            expect(response.body.message).toBe("Profile already exists for this user");
        });
    });

    describe('PUT /api/user/profile', () => {
        it('should update an existing profile', async () => {
            const profileDto: ProfileUpsertDto = {
                display_name: 'Updated User',
                gender: Gender.M,
                birthday: new Date('1990-01-01'),
                height: 180,
                weight: 75,
            };

            const response = await request(app.getHttpServer())
                .put('/api/user/profile')
                .send(profileDto)
                .expect(200);

            expect(response.body.data.display_name).toBe(profileDto.display_name);
        });

        it('should return an error if profile update fails', async () => {
            const profileDto: ProfileUpsertDto = {
                display_name: 'Updated User',
                gender: Gender.M,
                birthday: new Date('1990-01-01'),
                height: 180,
                weight: 75,
            };

            jest.spyOn(userService, 'upsertProfile').mockImplementationOnce(() => {
                throw new InternalServerErrorException("Error updating profile")
            });

            const response = await request(app.getHttpServer())
                .put('/api/user/profile')
                .send(profileDto)
                .expect(500);

            expect(response.body.message).toBe('Error updating profile');
        });
    });

    describe('PUT /api/user/interests', () => {
        it('should update the interests of the user', async () => {
            const interests = ['coding', 'music'];

            const response = await request(app.getHttpServer())
                .put('/api/user/interests')
                .send({ interests })
                .expect(200);

            expect(response.body.data).toEqual(interests);
        });

        it('should return an error if interests update fails', async () => {
            jest.spyOn(userService, 'updateInterests').mockImplementationOnce(() => {
                throw new InternalServerErrorException("Error updating interests")
            });

            const interests = ['coding', 'music'];

            const response = await request(app.getHttpServer())
                .put('/api/user/interests')
                .send({ interests })
                .expect(500);

            expect(response.body.message).toBe('Error updating interests');
        });
    });
});