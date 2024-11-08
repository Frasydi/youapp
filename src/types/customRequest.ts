import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Profile } from 'src/schemas/profile.schema';

export const User = createParamDecorator<{
    id: string,
    email: string,
    username: string,
    interest: string[],
    profile : Profile
}>(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as {
            username : string,
            sub : string
        };
    },
);

export type User = {
    username: string,
    sub: string,
}