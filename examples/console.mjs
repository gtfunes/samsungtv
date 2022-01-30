import readline from 'readline'
import { on } from 'events'
import samsung from '../build/index.js'

const { SamsungTV } = samsung

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const TV = new SamsungTV('192.168.1.94', 'c0:97:27:1f:1e:c2')
await TV.connect()

console.log('What key would you like to send?')

for await (const [command] of on(rl, 'line')) {
  await TV.sendKey(command)
}
