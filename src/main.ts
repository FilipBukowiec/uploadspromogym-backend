import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';

config(); 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const ENV = process.env.APP_ENV || 'development';
  const isDev = ENV === 'development';

  const port = isDev ? 3000 : Number(process.env.PORT) || 8080;
  const frontendUrl = isDev
    ? 'http://localhost:4200'
    : process.env.FRONTEND_PROD;

  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(port);
  console.log(`Server running on port ${port} [${ENV}] - CORS for ${frontendUrl}`);
}

bootstrap();
