import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      limit: Math.min(
        Math.max(parseInt(request.query.limit, 10) || 20, 1),
        100,
      ),
      cursor: request.query.cursor,
    };
  },
);
