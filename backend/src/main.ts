/**
 * @file main.ts
 * @description Entry point for the CodeTogether backend (NestJS). 
 * Initializes the application, sets up global pipes, CORS, static assets,
 * and Swagger API documentation.
 */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

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

  /**
   * Apply global validation pipe.
   * - Ensures DTO validation across all endpoints.
   * - `whitelist: true` removes properties not defined in DTOs.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  /**
   * Enable Cross-Origin Resource Sharing (CORS).
   * Allows the React frontend to access the backend from a different origin.
   */
  app.enableCors();

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
