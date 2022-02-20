import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { json } from 'express';
import cookieParser from 'cookie-parser';
import { graphqlUploadExpress, UploadOptions } from 'graphql-upload';
import { ConfigService } from '@nestjs/config';
import superRequest from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication, request: superRequest.SuperTest<superRequest.Test>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const configService = app.get(ConfigService);
    app.use(json());
    app.use(cookieParser());
    app.use(graphqlUploadExpress(configService.get<UploadOptions>('upload')));
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    request = superRequest(app.getHttpServer());
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(request).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
