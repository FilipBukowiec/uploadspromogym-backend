import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isDev = process.env.NODE_ENV !== 'production';
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
  console.log(`Server running on port ${port} [${isDev ? 'development' : 'production'}] - CORS for ${frontendUrl}`);
}

bootstrap();
