import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  userId: string;
  email: string;
};

type AuthenticatedRequest = {
  user: RequestUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
