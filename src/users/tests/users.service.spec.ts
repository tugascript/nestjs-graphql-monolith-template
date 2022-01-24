import { getRepositoryToken, MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/sqlite';
import { CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { config } from '../../config/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { UploaderModule } from '../../uploader/uploader.module';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../entities/user.entity';

const PASSWORD = 'Ab123456';

describe('AuthService', () => {
  let usersService: UsersService, usersRepository: EntityRepository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.REDIS_CACHE_TTL, 10),
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        MikroOrmModule.forFeature([UserEntity]),
        CommonModule,
        UploaderModule,
      ],
      providers: [
        UsersService,
        {
          provide: 'CommonModule',
          useClass: CommonModule,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get<EntityRepository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
    expect(usersRepository).toBeDefined();
  });
});
