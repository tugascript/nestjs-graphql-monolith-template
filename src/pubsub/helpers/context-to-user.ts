import { ICtx } from '../../common/interfaces/ctx.interface';

export const contextToUser = (ctx: ICtx): number => {
  if (ctx?.extra)
    return (ctx.extra.request as Record<any, any>)?.user as number;

  return (ctx.req as Record<any, any>).user as number;
};
