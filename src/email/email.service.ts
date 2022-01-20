import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendConfirmationEmail(
    { firstName, lastName, email }: UserEntity,
    url: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `Confirm your account ${name}`,
      template: './confirmation',
      context: {
        firstName,
        lastName,
        link: url,
      },
    });
  }

  public async sendPasswordResetEmail(
    { firstName, lastName, email }: UserEntity,
    url: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `Reset your password ${name}`,
      template: './password-reset',
      context: {
        firstName,
        lastName,
        link: url,
      },
    });
  }

  public async sendAccessCode(
    { email, firstName, lastName }: UserEntity,
    accessCode: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: `Your access code ${name}`,
      template: './login-confirmation',
      context: {
        firstName,
        lastName,
        code: accessCode,
      },
    });
  }
}
