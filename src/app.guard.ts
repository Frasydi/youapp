import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
import CustomHttpError from './types/error';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private appService : AppService) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        let token: string | null = null;
        if (req?.cookies?.accessToken != null) {
            token = req.cookies.accessToken;
        } else if (req?.headers.authorization != null) {
            const rawToken = req.headers.authorization.split(" ");
            if(rawToken[0] != "Bearer") throw new UnauthorizedException("You do not have access");
            token = rawToken[1];
        } else {
            throw new UnauthorizedException("You do not have access");
        }

        try {
            const payload = this.jwtService.verify(token || "");

            // Check if the token is blacklisted
            const isBlacklisted = await this.appService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new CustomHttpError("Token is blacklisted", 401);
            }

            (req as any).user = payload;
        } catch (err) {
            if(err instanceof CustomHttpError) {
                throw new HttpException(err.message, err.status)
            }
            throw new UnauthorizedException("You do not have access");
        }

        return true;
    }
}