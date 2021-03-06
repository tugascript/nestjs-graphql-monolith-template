import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().required(),
  PORT: Joi.number().required(),
  PLAYGROUND: Joi.bool().required(),
  URL: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_TIME: Joi.number().required(),
  JWT_CONFIRMATION_SECRET: Joi.string().required(),
  JWT_CONFIRMATION_TIME: Joi.number().required(),
  JWT_RESET_PASSWORD_SECRET: Joi.string().required(),
  JWT_RESET_PASSWORD_TIME: Joi.number().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_TIME: Joi.number().required(),
  JWT_WS_ACCESS_TIME: Joi.number().required(),
  REFRESH_COOKIE: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_SECURE: Joi.bool().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  BUCKET_NAME: Joi.string().required(),
  BUCKET_SECRET_KEY: Joi.string().required(),
  BUCKET_ACCESS_KEY: Joi.string().required(),
  BUCKET_REGION: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_CACHE_TTL: Joi.number().required(),
  MAX_FILE_SIZE: Joi.number().required(),
  MAX_FILES: Joi.number().required(),
  AUTH_UUID: Joi.string().required(),
  WS_UUID: Joi.string().required(),
});
