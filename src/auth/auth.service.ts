import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';
import { CommonService } from 'src/common/common.service';
import { LocalMessageType } from 'src/common/gql-types/message.type';
import { getUnixTime } from 'src/common/helpers/get-unix-time';
import { OnlineStatusEnum } from 'src/users/enums/online-status.enum';
import { v5 as uuidV5 } from 'uuid';
import { IJwt, ISingleJwt } from '../config/config';
import { EmailService } from '../email/email.service';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.input';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SessionEntity } from './entities/session.entity';
import { AuthType } from './gql-types/auth.type';
import { LoginInput } from './inputs/login.input';
import { RegisterInput } from './inputs/register.input';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from './interfaces/access-payload.interface';
import { ISessionData } from './interfaces/session-data.interface';
import {
  ITokenPayload,
  ITokenPayloadResponse,
} from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: EntityRepository<SessionEntity>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly url = this.configService.get<string>('url');
  private readonly authNamespace = this.configService.get<string>('AUTH_UUID');
  private readonly testing = this.configService.get<boolean>('testing');
  private readonly accessTime =
    this.configService.get<number>('jwt.access.time');

  //____________________ MUTATIONS ____________________

  /**
   * Register User
   *
   * Takes the register input, creates a new user in the db
   * and asyncronously sends a confirmation email
   */
  public async registerUser(input: RegisterInput): Promise<LocalMessageType> {
    const user = await this.usersService.createUser(input);
    this.sendConfirmationEmail(user);
    return new LocalMessageType('User registered successfully');
  }

  /**
   * Confirm Email
   *
   * Takes a confirmation token, confirms and updates the user
   */
  public async confirmEmail(
    res: Response,
    { confirmationToken }: ConfirmEmailDto,
  ): Promise<AuthType> {
    const payload = (await this.verifyAuthToken(
      confirmationToken,
      'confirmation',
    )) as ITokenPayloadResponse;
    const user = await this.usersService.getUserByPayload(payload);

    if (user.confirmed)
      throw new BadRequestException('Email already confirmed');

    user.confirmed = true;
    user.count++;
    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return new AuthType(accessToken, user);
  }

  /**
   * Login User
   *
   * Takes the login input, if two factor auth is true: it caches a new access code and
   * asyncronously sends it by email. If false, it sends an auth type
   */
  public async loginUser(
    res: Response,
    { email, password }: LoginInput,
  ): Promise<AuthType | LocalMessageType> {
    const user = await this.usersService.getUserForAuth(email);

    if (!(await compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');

    if (!user.confirmed) {
      this.sendConfirmationEmail(user);
      throw new UnauthorizedException(
        'Please confirm your account. A new email has been sent',
      );
    }

    if (user.twoFactor) {
      const code = this.generateAccessCode();

      await this.commonService.throwInternalError(
        this.cacheManager.set(
          uuidV5(email, this.authNamespace),
          await hash(code, 5),
        ),
      );

      this.emailService.sendAccessCode(user, code);

      return new LocalMessageType('Login confirmation code sent');
    }

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    return new AuthType(accessToken, user);
  }

  /**
   * Confirm Login
   *
   * Takes the confirm login input, checks the access code
   * and logins the user
   */
  public async confirmLogin(
    res: Response,
    { email, accessCode }: ConfirmLoginDto,
  ): Promise<AuthType> {
    const hashedCode = await this.commonService.throwInternalError(
      this.cacheManager.get<string>(uuidV5(email, this.authNamespace)),
    );

    if (!hashedCode || !(await compare(accessCode, hashedCode)))
      throw new UnauthorizedException('Access code is invalid or has expired');

    const user = await this.usersService.getUserForAuth(email);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    return new AuthType(accessToken, user);
  }

  /**
   * Logout User
   *
   * Removes the refresh token from the cookies
   */
  public logoutUser(res: Response): LocalMessageType {
    res.clearCookie(this.cookieName);
    return new LocalMessageType('Logout Successfully');
  }

  /**
   * Refresh Access Token
   *
   * Takes the request and response, and generates new auth tokens
   * based on the current refresh token.
   *
   * It generates both tokens so the user can stay logged in indefinatly
   */
  public async refreshAccessToken(
    req: Request,
    res: Response,
  ): Promise<string> {
    const token = req.cookies[this.cookieName];
    if (!token) throw new UnauthorizedException('Invalid refresh token');

    const payload = (await this.verifyAuthToken(
      token,
      'refresh',
    )) as ITokenPayloadResponse;
    const user = await this.usersService.getUserByPayload(payload);
    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return accessToken;
  }

  /**
   * Send Reset Password Email
   *
   * Takes a user email and sends a reset password email
   */
  public async sendResetPasswordEmail({
    email,
  }: ResetEmailDto): Promise<LocalMessageType> {
    const user = await this.usersService.getUncheckUser(email);

    if (user) {
      const resetToken = await this.generateAuthToken(
        { id: user.id, count: user.count },
        'resetPassword',
      );
      const url = `${this.url}/reset-password/${resetToken}/`;
      this.emailService.sendPasswordResetEmail(user, url);
    }

    return new LocalMessageType('Password reset email sent');
  }

  /**
   * Reset Password
   *
   * Resets password given a reset password jwt token
   */
  public async resetPassword({
    resetToken,
    passwords,
  }: ResetPasswordDto): Promise<LocalMessageType> {
    const payload = (await this.verifyAuthToken(
      resetToken,
      'resetPassword',
    )) as ITokenPayloadResponse;

    const { password1, password2 } = passwords;

    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    const user = await this.usersService.getUserByPayload(payload);
    user.count++;
    user.password = await hash(password1, 10);
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType('Password reseted successfully');
  }

  /**
   * Change Two Factor Auth
   *
   * Activates or deactivates two factor auth
   */
  public async changeTwoFactorAuth(
    userId: number,
    activate: boolean,
  ): Promise<LocalMessageType> {
    const user = await this.usersService.getUserById(userId);
    const status = activate ? 'activated' : 'deactivated';

    if (user.twoFactor === activate)
      throw new BadRequestException(
        `You already have ${status} two factor authentication`,
      );

    user.twoFactor = activate;
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType(
      `Two factor authentication ${status} successfully`,
    );
  }

  /**
   * Update Email
   *
   * Change current user email
   */
  public async updateEmail(
    res: Response,
    userId: number,
    { email, password }: ChangeEmailDto,
  ): Promise<AuthType> {
    const user = await this.usersService.getUserById(userId);

    if (!(await compare(password, user.password)))
      throw new BadRequestException('Wrong password!');

    user.email = email;
    user.count++;
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return new AuthType(accessToken, user);
  }

  public async updatePassword(
    res: Response,
    userId: number,
    { password, newPasswords }: ChangePasswordDto,
  ): Promise<AuthType> {
    const user = await this.usersService.getUserById(userId);

    if (!(await compare(password, user.password)))
      throw new BadRequestException('Wrong password!');

    const { password1, password2 } = newPasswords;

    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    user.password = await hash(password1, 10);
    user.count++;
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return new AuthType(accessToken, user);
  }

  //____________________ WebSocket Auth ____________________

  /**
   * Generate Ws Access Token
   *
   * Takes a normal access token and a refresh token, and
   * generates a ws access token for ws authentication
   */
  public async generateWsAccessToken(
    accessToken: string,
    refreshToken: string,
    status?: OnlineStatusEnum,
  ): Promise<string> {
    await this.verifyAuthToken(accessToken, 'access');
    const payload = (await this.verifyAuthToken(
      refreshToken,
      'refresh',
    )) as ITokenPayloadResponse;
    const user = await this.usersService.getUserByPayload(payload);

    const session = this.sessionsRepository.create({ user });
    if (user.onlineState === OnlineStatusEnum.OFFLINE || status)
      user.onlineState = status ? status : OnlineStatusEnum.ONLINE;

    await this.commonService.throwInternalError(
      this.cacheManager.set<ISessionData>(session.id, {
        count: user.count,
        time: getUnixTime(),
      }),
    );

    await this.commonService.throwInternalError(
      this.sessionsRepository.persistAndFlush(session),
    );

    return await this.generateAuthToken(
      { id: user.id, sessionId: session.id },
      'wsAccess',
    );
  }

  /**
   * Refresh User Session
   *
   * Refreshes user's websocket session, if session expired or is
   * invalid deletes it from cache and db, if it's the only one
   * makes the user online status offline
   */
  public async refreshUserSession(userId: number, sessionId: string) {
    const data = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionData>(sessionId),
    );

    if (!data) {
      await this.commonService.throwInternalError(
        this.sessionsRepository.nativeDelete({
          id: sessionId,
        }),
      );
      throw new UnauthorizedException('Invalid user session');
    }

    const { count, time } = data;
    const now = getUnixTime();

    if (now - time > this.accessTime) {
      const user = await this.usersService.getUserById(userId);

      if (user.count !== count) {
        await this.commonService.throwInternalError(
          this.sessionsRepository.nativeDelete({
            id: sessionId,
          }),
        );

        await this.commonService.throwInternalError(
          this.cacheManager.del(sessionId),
        );

        const sessionCount = await this.sessionsRepository.count({ user });
        if (sessionCount === 0) {
          user.onlineState = OnlineStatusEnum.OFFLINE;
          await this.usersService.saveUserToDb(user);
        }

        throw new UnauthorizedException('Session has expired');
      }

      data.time = now;
      await this.commonService.throwInternalError(
        this.cacheManager.set<ISessionData>(sessionId, data),
      );
    }
  }

  /**
   * Close User Session
   *
   * Removes websocket session from cache and db, if its the only
   * one, makes the user online status ofline
   */
  public async closeUserSession(wsAccessToken: string): Promise<void> {
    const payload = (await this.verifyAuthToken(
      wsAccessToken,
      'access',
    )) as IAccessPayloadResponse;
    const { sessionId, id } = payload;

    if (!sessionId) throw new UnauthorizedException('Invalid session id');
    const session = await this.sessionsRepository.findOne({ id: sessionId }, [
      'user',
    ]);

    if (!session) throw new UnauthorizedException('Invalid session id');

    const user = session.user;

    await this.commonService.throwInternalError(
      this.sessionsRepository.removeAndFlush(session),
    );
    await this.commonService.throwInternalError(
      this.cacheManager.del(sessionId),
    );

    const count = await this.sessionsRepository.count({ user: id });
    if (count === 0) {
      user.onlineState = OnlineStatusEnum.OFFLINE;
      await this.usersService.saveUserToDb(user);
    }
  }

  //____________________ PRIVATE METHODS ____________________

  /**
   * Send Confirmation Email
   *
   * Sends an email for the user to confirm
   * his account after registration
   */
  private async sendConfirmationEmail(user: UserEntity): Promise<string> {
    const emailToken = await this.generateAuthToken(
      { id: user.id, count: user.count },
      'confirmation',
    );
    const url = `${this.url}/confirm-email/${emailToken}/`;
    await this.emailService.sendConfirmationEmail(user, url);
    return emailToken;
  }

  /**
   * Generate Auth Tokens
   *
   * Generates an array with both the access and
   * refresh token.
   *
   * This function takes advantage of Promise.all.
   */
  private async generateAuthTokens({
    id,
    count,
  }: UserEntity): Promise<[string, string]> {
    return Promise.all([
      this.generateAuthToken({ id }, 'access'),
      this.generateAuthToken({ id, count }, 'refresh'),
    ]);
  }

  /**
   * Generate Jwt Token
   *
   * A generict jwt generator that generates all tokens needed
   * for auth (access, refresh, confirmation & resetPassword)
   */
  private async generateAuthToken(
    payload: ITokenPayload | IAccessPayload,
    type: keyof IJwt,
  ): Promise<string> {
    const { secret, time } = this.configService.get<ISingleJwt>(`jwt.${type}`);

    return new Promise((resolve) => {
      sign(payload, secret, { expiresIn: time }, (error, token) => {
        if (error) {
          throw new InternalServerErrorException('Something went wrong');
        }
        resolve(token);
      });
    });
  }

  /**
   * Verify Auth Token
   *
   * A generic jwt verifier that verifies all token needed for auth
   */
  private async verifyAuthToken(
    token: string,
    type: keyof IJwt,
  ): Promise<ITokenPayloadResponse | IAccessPayloadResponse> {
    const secret = this.configService.get<string>(`jwt.${type}.secret`);

    return await new Promise((resolve) => {
      verify(token, secret, (error, payload: ITokenPayloadResponse) => {
        if (error) {
          if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedException('Token has expired');
          } else {
            throw new UnauthorizedException(error.message);
          }
        }

        resolve(payload);
      });
    });
  }

  /**
   * Generate Access Code
   *
   * Generates a 6 char long number string for two factor auth
   */
  private generateAccessCode(): string {
    const nums = '0123456789';

    let code = '';
    while (code.length < 6) {
      const i = Math.floor(Math.random() * nums.length);
      code += nums[i];
    }

    return code;
  }

  /**
   * Save Refresh Cookie
   *
   * Saves the refresh token as an http only cookie to
   * be used for refreshing the access token
   */
  private saveRefreshCookie(res: Response, token: string): void {
    res.cookie(this.cookieName, token, {
      secure: !this.testing,
      httpOnly: true,
      path: '/',
      expires: new Date(Date.now() + 604800000),
    });
  }
}
