import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity]),
    // CommonService // Uncomment for tests
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
