import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { BaseRedisCache } from 'apollo-server-cache-redis';
import { ApolloServerPluginCacheControl } from 'apollo-server-core';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import * as Redis from 'ioredis';
import { RedisOptions } from 'ioredis';
import { ICtx } from '../common/interfaces/ctx.interface';

@Injectable()
export class GraphQLConfig implements GqlOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');

  createGqlOptions(): GqlModuleOptions {
    return {
      context: ({ req, res }): ICtx => ({
        req,
        res,
      }),
      path: '/api/graphql',
      autoSchemaFile: './schema.gql',
      debug: this.configService.get<boolean>('testing'),
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
      cache: this.configService.get<boolean>('testing')
        ? undefined
        : new BaseRedisCache({
            client: new Redis(this.configService.get<RedisOptions>('redis')),
          }),
    };
  }
}
