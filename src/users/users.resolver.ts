import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
