import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
export class MinimalAppModule {}

async function bootstrap() {
  console.log('Starting minimal app...');
  const app = await NestFactory.create(MinimalAppModule);
  
  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Minimal server is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start minimal application:', error);
  process.exit(1);
});
