import { createUnionType } from '@nestjs/graphql';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { AuthType } from './auth.type';

export const AuthUnion = createUnionType({
  name: 'AuthUnion',
  types: () => [AuthType, LocalMessageType],
  resolveType(value) {
    if ((value as AuthType).accessToken) return AuthType;
    if ((value as LocalMessageType).message) return LocalMessageType;
    return null;
  },
});
