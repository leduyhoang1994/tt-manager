export enum MotherShipCommand {
  REPORT_STATUS = 'REPORT_STATUS',
}

export default class MotherShip {
  protected pm2;

  constructor() {
    this.pm2 = require('pm2');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.pm2.connect(function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(true);
      });
    });
  }

  async lauch(username: string) {
    return new Promise((resolve, reject) => {
      this.pm2.start({
        script: 'processes/tiktok-bot.js',
        args: `--name=${username}`,
        name: `${username}-listener`
      }, (err, apps) => {
        if (err) {
          reject(err);
        }

        resolve(apps);
      });
    });
  }

  async orderTiktokBot(id: number, command: MotherShipCommand, data = {}) {
    console.log(`OUT | Send data to ${id}`);

    return new Promise((resolve, reject) => {
      console.log(`Order Tiktok Bot [${id}] for ${command}`);

      this.pm2.sendDataToProcessId({
        id,
        type: 'process:msg',
        data: {
          command: MotherShipCommand.REPORT_STATUS,
          data
        },
        topic: 'COMMAND'
      }, function (err, res) {
        console.log('res send', err, res);
        
      });

      this.pm2.launchBus(function (err, pm2_bus) {
        pm2_bus.on('process:msg', function (packet) {
          resolve(packet);
        })
      });
    });
  }

  async list() {
    return new Promise((resolve, reject) => {
      this.pm2.list((err, list) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(list);
      });
    });
  }

  async restart() {
    return new Promise((resolve, reject) => {

    });
  }
}