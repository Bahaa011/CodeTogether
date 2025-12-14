/**
 * @file main.ts
 * @description Entry point for the CodeTogether backend (NestJS).
 * Initializes the application, sets up global pipes, CORS, static assets,
 * and Swagger API documentation.
 */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
/**
 * Bootstraps the NestJS application.
 *
 * This function:
 * - Loads environment variables
 * - Creates the main Nest application
 * - Applies global validation pipes
 * - Enables CORS for frontend communication
 * - Serves static assets (uploads)
 * - Configures Swagger API documentation
 * - Starts the HTTP server
 */
async function bootstrap(): Promise<void> {
  // Create the Nest application instance (Express-based)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Enable Socket.IO for WebSocket gateways (collaboration, presence, terminal)
  app.useWebSocketAdapter(new IoAdapter(app));

  /**
   * Apply global validation pipe.
   * - Ensures DTO validation across all endpoints.
   * - `whitelist: true` removes properties not defined in DTOs.
   */
  class AppValidationPipe extends ValidationPipe {
    public override async transform(
      value: unknown,
      metadata: ArgumentMetadata,
    ) {
      const metatypeName = metadata.metatype?.name;
      const graphQLUploadTypeName = GraphQLUpload?.name ?? 'GraphQLUpload';
      const isUploadScalar =
        metadata.metatype === Promise ||
        metatypeName === 'Promise' ||
        metatypeName === graphQLUploadTypeName;
      const isUploadArgument = metadata.data === 'file';
      const isPromiseValue =
        value instanceof Promise ||
        (value !== null &&
          typeof value === 'object' &&
          'then' in value &&
          typeof (value as Promise<unknown>).then === 'function');

      if (isUploadScalar || isUploadArgument || isPromiseValue) {
        return value;
      }
      return super.transform(value, metadata);
    }
  }

  app.useGlobalPipes(
    new AppValidationPipe({
      whitelist: true,
    }),
  );

  /**
   * Enable Cross-Origin Resource Sharing (CORS) with credentials support.
   * We whitelist the frontend host instead of using '*' so cookies and headers
   * that rely on credentials work (GraphQL sessions, file uploads, etc.).
   */
  const FRONTEND_URL =
    process.env.FRONTEND_URL ?? process.env.VITE_API_URL ?? 'http://localhost:5173';
  const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 4 }));

  /**
   * Serve static assets from the 'uploads' directory.
   * Files can be accessed via http://localhost:3000/uploads/<filename>.
   */
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  /**
   * Configure Swagger (OpenAPI) for automatic API documentation.
   * Access the docs at http://localhost:3000/api
   */
  const config = new DocumentBuilder()
    .setTitle('CodeTogether API')
    .setDescription('API documentation for the CodeTogether backend')
    .setVersion('1.0')
    .addBearerAuth() // Adds JWT Bearer auth option to Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  /**
   * Start the NestJS server.
   * Default port: 3000
   */
  await app.listen(3000);
  console.log(`🚀 Server running on http://localhost:3000`);
}

// Execute the bootstrap function to start the app
bootstrap();
