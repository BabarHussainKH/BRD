import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  branchId?: string | null;
  clusterId?: string | null;
  regionId?: string | null;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as AuthUser;
});
