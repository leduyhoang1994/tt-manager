class TiktokBot {
  username;

  COMMANDS = {
    REPORT_STATUS: (id, command, data) => {
      console.log('Report Status Success');
      this.reportMotherShip(id, command, {
        status: 1,
        message: `I'm OK.`,
      });
    },
    SETUP: (id, command, data) => {
      this.id = id;
      this.name = data.name;
      console.log('Setup success');
      this.reportMotherShip(id, command, {
        message: `Setup succeed.`,
      });
    }
  };

  CALLS = {
    HELP: 'HELP',
    WHO_AM_I: 'WHO_AM_I'
  };

  constructor(username) {
    this.username = username;
  }

  hearingMotherShip() {
    process.on('message', (packet) => {
      const topic = packet.topic;

      if (topic === 'COMMAND') {
        this.executeOrder(packet.id, packet.data.command, packet.data.data);
        return
      }
    });
  }

  executeOrder(id, command, data) {
    const executor = this.COMMANDS[command];

    if (!executor) {
      return;
    }

    executor(id, command, data);
  }

  reportMotherShip(id, command, data) {
    data.botId = id;
    data.reportToCommand = command;
    data.botInfo = this;
    data.type = 'EXECUTE_ORDER';

    process.send({
      type: 'process:msg',
      data
    });
  }

  callMotherShip(id, command, data = {}) {
    data.botId = id;
    data.command = command;
    data.botInfo = this;
    data.type = 'BOT_CALL';

    console.log(`Call mothership for ${command}`);
    process.send({
      type: 'process:msg',
      data
    });
  }

  async start() {
    console.log(`Launching bot with ID ${this.username} . . .`);

    this.hearingMotherShip();

    return new Promise((resolve, reject) => {
      setInterval(() => {
        if (this.id === undefined) {
          this.callMotherShip(this.id, this.CALLS.WHO_AM_I);
        }
      }, 5000);
    });
  }
}

function getArgs() {
  const args = {};
  process.argv
    .slice(2, process.argv.length)
    .forEach(arg => {
      // long arg
      if (arg.slice(0, 2) === '--') {
        const longArg = arg.split('=');
        const longArgFlag = longArg[0].slice(2, longArg[0].length);
        const longArgValue = longArg.length > 1 ? longArg[1] : true;
        args[longArgFlag] = longArgValue;
      }
      // flags
      else if (arg[0] === '-') {
        const flags = arg.slice(1, arg.length).split('');
        flags.forEach(flag => {
          args[flag] = true;
        });
      }
    });
  return args;
}

(async () => {
  const args = getArgs();

  const username = args.name;

  await (new TiktokBot(username)).start();
})();