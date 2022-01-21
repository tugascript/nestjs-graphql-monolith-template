import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    if (ctx.extra)
      return (ctx.extra.request as Record<string, any>).user as number;

    return (ctx.req as Record<string, any>).user as number;
  },
);
