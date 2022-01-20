import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailConfig } from './config';
import { join } from 'path';

@Injectable()
export class MailerConfig implements MailerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    return {
      transport: this.configService.get<IEmailConfig>('emailService'),
      defaults: {
        from: '"The Personal Blog Team" <no-reply@tugascript.com>',
      },
      template: {
        dir: join(__dirname, '../email/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
