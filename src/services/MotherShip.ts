export enum MotherShipCommand {
  REPORT_STATUS = 'REPORT_STATUS',
  SETUP = 'SETUP'
}

export enum BotCall {
  WHO_AM_I = 'WHO_AM_I',
}

export default class MotherShip {
  protected pm2;
  protected pm2_bus_commandor;
  protected pm2_bus_listener;
  protected procSuffix = '-listener';

  constructor() {
    this.pm2 = require('pm2');
  }

  async checkHealth() {
    const botList = await this.list();
    const deathBots = [];

    for (let i = 0; i < botList.length; i++) {
      const bot = botList[i];

      if (bot.pm2_env.status !== 'online') {
        
        const username = bot.name.slice(0, bot.name.length - this.procSuffix.length);

        deathBots.push(username);
        
        await this.lauch(username);
      }
    }

    if (deathBots.length === 0) {
      console.log(`All bots are okay !`);
    } else {
      console.log(`Bots [${deathBots.join(', ')}] are restarted !`);
    }

    setTimeout(() => {
      this.checkHealth();
    }, 5000);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.pm2.connect((err) => {
        if (err) {
          reject(err);
          return;
        }

        this.pm2.launchBus((err, pm2_bus) => {
          this.pm2_bus_commandor = pm2_bus;

          this.pm2.launchBus((err, pm2_bus2) => {
            this.pm2_bus_listener = pm2_bus2;
            this.setupBotListener();
            resolve(true);

            this.checkHealth();
          });
        });
      });
    });
  }

  setupBotListener() {
    this.pm2_bus_listener.on('process:msg', async (packet) => {
      const data = packet.data;
      const botInfo = data.botInfo;

      if (data.type !== 'BOT_CALL') {
        return;
      }

      console.log(`Bot[${botInfo.username} call for ${data.command}]`);

      if (data.command === BotCall.WHO_AM_I) {
        const bot = await this.findBotWithUsername(botInfo.username);

        this.orderTiktokBot(bot.pm_id, MotherShipCommand.SETUP, {
          id: bot.pm_id,
          name: bot.name
        });
      }
    });
  }

  async findBotWithUsername(username: string) {
    const bots = await this.list();

    const existBot = bots.find((bot) => {
      return bot.name === `${username}${this.procSuffix}`;
    });

    return existBot;
  }

  async lauch(username: string) {
    return new Promise(async (resolve, reject) => {
      console.log(`Lauching bot[${username}] . . .`);

      const existBot = await this.findBotWithUsername(username);

      if (existBot && existBot.pm2_env.status === 'online') {
        console.log(`Bot named ${username} existed! Pass!`);
        resolve(true);
        return;
      }

      this.pm2.start({
        script: 'processes/tiktok-bot.js',
        namespace: 'tiktok-bots',
        args: `--name=${username}`,
        name: `${username}${this.procSuffix}`
      }, (err, apps) => {
        if (err) {
          reject(err);
        }

        const bot = apps[0];

        const setupData = {
          id: bot.pm_id,
          name: bot.name
        };

        if (!bot.pm_id) {
          setupData.id = bot.pm2_env.pm_id;
          setupData.name = bot.pm2_env.name;
        }

        this.orderTiktokBot(setupData.id, MotherShipCommand.SETUP, setupData)

        resolve(true);
      });
    });
  }

  async orderTiktokBot(id: number, command: MotherShipCommand, data = {}) {
    return new Promise((resolve, reject) => {
      console.log(`Order Bot[${id}] for ${command}`);

      this.pm2.sendDataToProcessId({
        id,
        type: 'process:msg',
        data: {
          command: command,
          data
        },
        topic: 'COMMAND'
      }, function (err, res) {

      });

      this.pm2_bus_commandor.off('process:msg');
      this.pm2_bus_commandor.on('process:msg', function (packet) {
        const data = packet.data;
        const botInfo = data.botInfo;

        if (data.type !== 'EXECUTE_ORDER') {
          return;
        }

        resolve(packet);
        console.log(`Bot[${botInfo.username}] report: ${data.message}`);
      });
    });
  }

  async list(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.pm2.list((err, list) => {
        if (err) {
          reject([]);
          return;
        }

        resolve(list);
      });
    });
  }
}