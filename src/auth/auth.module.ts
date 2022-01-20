import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { JwtServiceConfig } from '../config/jwt.config';
import { EmailModule } from '../email/email.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useClass: JwtServiceConfig,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    EmailModule,
    // ConfigModule, // remove on testing
  ],
  providers: [AuthService, JwtStrategy, AuthResolver],
  controllers: [AuthController],
})
export class AuthModule {}
