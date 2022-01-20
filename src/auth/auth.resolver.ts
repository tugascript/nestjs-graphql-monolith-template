import { ParseBoolPipe } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { LocalMessageType } from '../common/gql-types/message.type';
import { ICtx } from '../common/interfaces/ctx.interface';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { AuthUnion } from './gql-types/auth-union.type';
import { AuthType } from './gql-types/auth.type';
import { ConfirmLoginInput } from './inputs/confirm-login.input';
import { LoginInput } from './inputs/login.input';
import { RegisterInput } from './inputs/register.input';
import { ResetPasswordInput } from './inputs/reset-password.input';

@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => LocalMessageType)
  public async registerUser(
    @Args('input') input: RegisterInput,
  ): Promise<LocalMessageType> {
    return this.authService.registerUser(input);
  }

  @Public()
  @Mutation(() => AuthType)
  public async confirmEmail(
    @Context() { res }: ICtx,
    @Args() dto: ConfirmEmailDto,
  ): Promise<AuthType> {
    return this.authService.confirmEmail(res, dto);
  }

  @Public()
  @Mutation(() => AuthUnion)
  public async loginUser(
    @Context() { res }: ICtx,
    @Args('input') input: LoginInput,
  ): Promise<AuthType | LocalMessageType> {
    return this.authService.loginUser(res, input);
  }

  @Public()
  @Mutation(() => AuthType)
  public async confirmUserLogin(
    @Context() { res }: ICtx,
    @Args('input') input: ConfirmLoginInput,
  ): Promise<AuthType> {
    return this.authService.confirmLogin(res, input);
  }

  @Mutation(() => LocalMessageType)
  public async logoutUser(@Context() { res }: ICtx): Promise<LocalMessageType> {
    return this.authService.logoutUser(res);
  }

  @Public()
  @Mutation(() => LocalMessageType)
  public async sendResetPasswordEmail(
    @Args() dto: ResetEmailDto,
  ): Promise<LocalMessageType> {
    return this.authService.sendResetPasswordEmail(dto);
  }

  @Public()
  @Mutation(() => LocalMessageType)
  public async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<LocalMessageType> {
    return this.authService.resetPassword(input);
  }

  @Mutation(() => LocalMessageType)
  public async changeTwoFactorAuthentication(
    @CurrentUser() userId: number,
    @Args('activate', ParseBoolPipe) activate: boolean,
  ) {
    return this.authService.changeTwoFactorAuth(userId, activate);
  }
}
