import samsung from '../build/index.js'

const { SamsungTV, KEY_CODES } = samsung

const TV = new SamsungTV('192.168.1.94', 'c0:97:27:1f:1e:c2')
await TV.connect()

await TV.sendKey(KEY_CODES.KEY_VOLUP)
await TV.sendKey(KEY_CODES.KEY_VOLUP)
await TV.sendKey(KEY_CODES.KEY_VOLUP)
await TV.sendKey(KEY_CODES.KEY_VOLDOWN)
await TV.sendKey(KEY_CODES.KEY_VOLDOWN)
await TV.sendKey(KEY_CODES.KEY_VOLDOWN)

await TV.sendKey(KEY_CODES.KEY_POWER)
await TV.disconnect()
