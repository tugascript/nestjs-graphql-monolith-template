import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterInput } from '../auth/inputs/register.input';
import { CommonService } from '../common/common.service';
import { hash } from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { ITokenPayload } from 'src/auth/interfaces/token-payload.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    private readonly commonService: CommonService,
  ) {}

  //____________________ MUTATIONS ____________________

  /**
   * Create User
   *
   * Creates a new user and saves him in db
   */
  public async createUser({
    name,
    email,
    password1,
    password2,
  }: RegisterInput): Promise<UserEntity> {
    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    name = this.commonService.formatTitle(name);
    const password = await hash(password1, 10);

    let username = this.commonService.generatePointSlug(name);
    const count = await this.usersRepository.count({
      username: { $like: `${username}%` },
    });
    if (count > 0) username += count.toString();

    const user = this.usersRepository.create({
      name,
      username,
      email,
      password,
    });

    await this.saveUserToDb(user, true);
    return user;
  }

  //____________________ QUERIES ____________________

  /**
   * Get User For Auth
   *
   * Gets a user by email for auth
   */
  public async getUserForAuth(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  /**
   * Get Uncheck User
   *
   * Gets a user by email and does not check if it exists
   */
  public async getUncheckUser(
    email: string,
  ): Promise<UserEntity | undefined | null> {
    const user = await this.usersRepository.findOne({ email });
    return user;
  }

  /**
   * Get User By Payload
   *
   * Gets user by jwt payload for auth
   */
  public async getUserByPayload({
    id,
    count,
  }: ITokenPayload): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id, count });
    if (!user)
      throw new UnauthorizedException('Token is invalid or has expired');
    return user;
  }

  /**
   * Get User By Id
   *
   * Gets user by id, usually the current logged in user
   */
  public async getUserById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.commonService.checkExistence('User', user);
    return user;
  }

  //____________________ OTHER ____________________

  /**
   * Save User To Database
   *
   * Inserts or updates user in the database.
   * This method exists because saving the user has
   * to be shared with the auth service.
   */
  public async saveUserToDb(user: UserEntity, isNew = false): Promise<void> {
    await this.commonService.validateEntity(user);

    if (isNew) this.usersRepository.persist(user);

    try {
      await this.usersRepository.flush();
    } catch (error) {
      this.commonService.throwDuplicateError(error, 'Email already exists');
    }
  }
}
