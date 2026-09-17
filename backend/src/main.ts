import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/config.service.js';
import { configureApp } from './app.setup.js';
import { bootstrapOtel } from './observability/otel.js';
import { bootstrapSentry } from './observability/sentry.js';

async function bootstrap() {
  // Started before NestFactory.create so the SDK's instrumentation patches are in
  // place before Nest builds its module graph. Full coverage of modules whose
  // instrumentation-relevant code runs at import time would need a preload (e.g.
  // `node --import ./dist/observability/otel-register.js`) in production — not
  // set up in Phase 0; this in-process call is sufficient for now.
  bootstrapOtel();
  bootstrapSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfigService);

  configureApp(app);
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Coifyn API')
    .setVersion('1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
  );

  const port = config.get('PORT');
  await app.listen(port);
  app.get(Logger).log(`Coifyn API listening on :${port}`);
}

await bootstrap();
