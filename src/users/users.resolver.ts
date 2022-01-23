import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GetRes } from '../auth/decorators/get-res.decorator';
import { LocalMessageType } from '../common/gql-types/message.type';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { OnlineStatusEnum } from './enums/online-status.enum';
import { UsersService } from './users.service';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserEntity)
  public async updateProfilePicture(
    @CurrentUser() userId: number,
    @Args() dto: ProfilePictureDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfilePicture(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async updateOnlineStatus(
    @CurrentUser() userId: number,
    @Args() dto: OnlineStatusDto,
  ): Promise<LocalMessageType> {
    return this.usersService.updateDefaultStatus(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async deleteAccount(
    @GetRes() res: Response,
    @CurrentUser() userId: number,
    @Args('password') password: string,
  ): Promise<LocalMessageType> {
    return this.usersService.deleteUser(res, userId, password);
  }

  @Query(() => UserEntity)
  public async getCurrentUser(
    @CurrentUser() userId: number,
  ): Promise<UserEntity> {
    return this.usersService.getUserById(userId);
  }

  @ResolveField('onlineStatus', () => OnlineStatusEnum)
  public async getOnlineState(
    @Parent() user: UserEntity,
  ): Promise<OnlineStatusEnum> {
    return this.usersService.getUserOnlineStatus(user.id);
  }
}
