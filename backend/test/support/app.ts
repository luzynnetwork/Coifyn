import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

export interface TestApp {
  app: INestApplication;
  http: supertest.Agent;
  close: () => Promise<void>;
}

/** Boots the real Nest app against the e2e database with the production pipeline
 *  (configureApp), and hands back a supertest agent bound to it. */
export async function createTestApp(): Promise<TestApp> {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  configureApp(app);
  await app.init();

  return {
    app,
    http: supertest.agent(app.getHttpServer()),
    close: () => app.close(),
  };
}
