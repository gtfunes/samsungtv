import { on } from 'events'
import samsung from '../build/index.js'

const { SamsungTV, KEY_CODES } = samsung

const QUIT = '\u0003'

const KEYUP = '\u001b[A'
const KEYDOWN = '\u001b[B'

const TAB = '\t'
const SPACE = ' '
const ENTER = '\r'
const ESCAPE = '\u001b'

const TV = new SamsungTV('192.168.1.94', 'c0:97:27:1f:1e:c2')
await TV.connect()

const stdin = process.stdin
// Operate stream as a raw device
stdin.setRawMode(true)
// Let's work with plain text
stdin.setEncoding('utf8')
// explicity start the readable stream and keep event loop running
stdin.resume()

for await (const [key] of on(stdin, 'data')) {
  switch (key) {
    case 'w':
      await TV.sendKey(KEY_CODES.KEY_UP)
      break
    case 's':
      await TV.sendKey(KEY_CODES.KEY_DOWN)
      break
    case 'd':
      await TV.sendKey(KEY_CODES.KEY_RIGHT)
      break
    case 'a':
      await TV.sendKey(KEY_CODES.KEY_LEFT)
      break
    case KEYUP:
      await TV.sendKey(KEY_CODES.KEY_VOLUP)
      break
    case KEYDOWN:
      await TV.sendKey(KEY_CODES.KEY_VOLDOWN)
      break
    case SPACE:
      await TV.sendKey(KEY_CODES.KEY_MENU)
      break
    case TAB:
      await TV.sendKey(KEY_CODES.KEY_SOURCE)
      break
    case ESCAPE:
      await TV.sendKey(KEY_CODES.KEY_POWER)
      break
    case ENTER:
      await TV.sendKey(KEY_CODES.KEY_ENTER)
      break
    case QUIT:
      process.exit(0)
    default:
      break
  }
}
