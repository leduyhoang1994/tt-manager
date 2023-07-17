class TiktokBot {
  username;

  COMMANDS = {
    REPORT_STATUS: (id, command, data) => {
      this.reportMotherShip(id, command, {
        status: `I'm OK.`
      });
    }
  };

  constructor(username) {
    this.username = username;
  }

  hearingMotherShip() {
    process.on('message', (packet) => {
      console.log(`Receive from mothership: `, packet);
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
    process.send({
      type: 'process:msg',
      botId: id,
      reportToCommand: command,
      data
    });
  }

  async start() {
    console.log(`Launching bot with ID ${this.username} . . .`);

    this.hearingMotherShip();

    return new Promise((resolve, reject) => {
      // setInterval(() => {
      //   console.log(`Bot[${this.username}] is still alive !`);
      // }, 1000);
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