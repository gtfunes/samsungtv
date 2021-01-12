import readline from 'readline';
import { on } from 'events';
import {SamsungTV} from 'samsungtv'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TV = new SamsungTV('192.168.1.94', 'c0:97:27:1f:1e:c2')
await TV.connect()

console.log('What send?');

for await (const [command] of on(rl, 'line')) {
  await TV.sendKey(command);
}
