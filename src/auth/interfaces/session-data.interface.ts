import { OnlineStatusEnum } from '../enums/online-status.enum';
import { ITokenPayloadResponse } from './token-payload.interface';

export interface ISessionData extends ITokenPayloadResponse {
  status: OnlineStatusEnum;
  read: Record<number, number>;
}
