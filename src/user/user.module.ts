import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedModule } from '../shared.module';

@Module({
    imports :[SharedModule],
    providers: [UserService],
    controllers: [UserController],

})  
export class UserModule {}
