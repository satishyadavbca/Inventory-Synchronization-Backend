// Load variables from a local .env file into process.env before anything else
// reads them. In containers/production, env vars are injected by the platform
// and no .env file is present — dotenv simply no-ops in that case.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

/**
 * Environment variables that must be present for the application to boot.
 * We fail fast at startup so misconfiguration surfaces immediately instead of
 * at the first request. Only variable NAMES are ever reported — never values.
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Set them in your .env file (see .env.example) before starting the server.',
    );
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin = process.env.FRONTEND_URL; // e.g., your production URL

      if (
        !origin ||
        origin === allowedOrigin ||
        origin.startsWith("http://localhost:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'csrf-token'],
  });

  // app.use(csurf({ cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  app.get(Logger).log(`Application is running on port ${port}`);
}

bootstrap().catch((err) => {
  // Fail fast on any bootstrap error (missing env vars, unreachable DB, etc.).
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
