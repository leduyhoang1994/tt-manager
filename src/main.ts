import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import MotherShip, { MotherShipCommand } from './services/MotherShip';
import pm2 from 'pm2';

async function startListener() {
  const motherShip = new MotherShip();

  const connectRes = await motherShip.connect();

  console.log("Manager Connection : ", connectRes);

  if (connectRes !== true) {
    return null;
  }

  for (let i = 0; i < 50; i++) {
    await motherShip.lauch(`aircraft-${i}`);
  }

  return motherShip;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const listener = await startListener();

  await app.listen(3000);
}
bootstrap();
