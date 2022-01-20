import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType('Auth')
export class AuthType {
  @Field(() => String)
  public accessToken!: string;

  @Field(() => UserEntity)
  public user!: UserEntity;

  constructor(accessToken: string, user: UserEntity) {
    this.accessToken = accessToken;
    this.user = user;
  }
}
