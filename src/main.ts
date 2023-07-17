import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import MotherShip, { MotherShipCommand } from './services/MotherShip';

async function startListener() {
  const motherShip = new MotherShip();

  const connectRes = await motherShip.connect();

  console.log("Manager Connection : ", connectRes);

  if (connectRes !== true) {
    return null;
  }

  await motherShip.lauch('hoangbeat');
  const list = await motherShip.list();

  const status = await motherShip.orderTiktokBot(list[0].pm_id, MotherShipCommand.REPORT_STATUS);

  console.log({status});
  

  return motherShip;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const listener = await startListener();

  //   pm2.start({
  //     script: 'processes/tiktok-live-listener.js',
  //     name: 'listener'
  //   }, function (err, apps) {
  //     if (err) {
  //       console.error(err)
  //       return pm2.disconnect()
  //     }

  //     console.log(apps);


  //     // pm2.list((err, list) => {
  //     //   console.log(err, list)

  //     //   pm2.restart('listener', (err, proc) => {
  //     //     // Disconnects from PM2
  //     //     pm2.disconnect()
  //     //   })
  //     // })
  //   })
  // })

  await app.listen(3000);
}
bootstrap();
