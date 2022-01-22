import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { BaseRedisCache } from 'apollo-server-cache-redis';
import { ApolloServerPluginCacheControl } from 'apollo-server-core';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { Request } from 'express';
import * as Redis from 'ioredis';
import { AuthService } from '../auth/auth.service';
import { ICtx } from '../common/interfaces/ctx.interface';
import { ISubscriptionCtx } from '../common/interfaces/subscription-ctx.interface';
import { DataloadersService } from '../dataloaders/dataloaders.service';
import { OnlineStatusEnum } from '../users/enums/online-status.enum';

@Injectable()
export class GraphQLConfig implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly loadersService: DataloadersService,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly testing = this.configService.get<boolean>('testing');

  public createGqlOptions(): GqlModuleOptions {
    return {
      context: ({ req, res }): ICtx => ({
        req,
        res,
        loaders: this.loadersService.createLoaders(),
      }),
      path: '/api/graphql',
      autoSchemaFile: './schema.gql',
      debug: this.testing,
      sortSchema: true,
      bodyParserConfig: false,
      playground: this.configService.get<boolean>('playground'),
      plugins: [
        ApolloServerPluginCacheControl({ defaultMaxAge: 600 }),
        responseCachePlugin(),
      ],
      cors: {
        origin: this.configService.get<string>('url'),
        credentials: true,
      },
      cache: this.testing
        ? undefined
        : new BaseRedisCache({
            client: new Redis(
              this.configService.get<Redis.RedisOptions>('redis'),
            ),
          }),
      subscriptions: {
        'graphql-ws': {
          onConnect: async (ctx) => {
            const token = ctx?.connectionParams?.token as string | undefined;

            if (!token) throw new UnauthorizedException();

            await this.setHeader(
              (ctx.extra as ISubscriptionCtx).request,
              token,
              ctx?.connectionParams?.status as OnlineStatusEnum | undefined,
            );
          },
          onSubscribe: (ctx, message) => {
            (ctx.extra as ISubscriptionCtx).payload = message.payload;
            (ctx.extra as ISubscriptionCtx).loaders =
              this.loadersService.createLoaders();
          },
          onClose: async (ctx) => {
            const token = (
              ctx.extra as ISubscriptionCtx
            ).request.headers.authorization?.split(' ')[1] as string;

            if (token) await this.authService.closeUserSession(token);
          },
        },
      },
    };
  }

  private async setHeader(
    req: Request,
    token: string,
    status?: OnlineStatusEnum,
  ): Promise<void> {
    const cookieArr: string[] = req.headers.cookie?.split('; ') ?? [];

    if (cookieArr.length > 0) {
      for (const cookie of cookieArr) {
        if (cookie.startsWith(`${this.cookieName}=`)) {
          const refreshToken = cookie.split('=')[1];
          const wsToken = await this.authService.generateWsAccessToken(
            token,
            refreshToken,
            status,
          );
          req.headers.authorization = `Bearer ${wsToken}`;
          return;
        }
      }
    }

    throw new UnauthorizedException();
  }
}
