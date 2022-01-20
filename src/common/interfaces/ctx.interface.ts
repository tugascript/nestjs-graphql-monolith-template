import { Request, Response } from 'express';
import { ISubscriptionCtx } from './subscription-ctx.interface';

export interface ICtx {
  res: Response;
  req: Request;
  // Just In case you need to add subscriptions in the future
  extra?: ISubscriptionCtx | null;
}
