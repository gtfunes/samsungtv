import { format } from 'util'

/**
 * minimal stand-in for the npmlog-backed logger that appium-support
 * provided: writes one `<level> <prefix> <arg>` line per argument to
 * stderr, which is what npmlog does for multi-argument calls
*/

const LEVEL_STYLES = {
  info: '\u001b[32m',
  'ERR!': '\u001b[31m'
}
const PREFIX_STYLE = '\u001b[35m'
const RESET_STYLE = '\u001b[0m'

const paint = (style, text) => process.stderr.isTTY
  ? `${style}${text}${RESET_STYLE}`
  : text

const write = (level, prefix, args) => {
  const label = paint(LEVEL_STYLES[level], level)
  const scope = paint(PREFIX_STYLE, prefix)

  for (const arg of args) {
    process.stderr.write(`${label} ${scope} ${format(arg)}\n`)
  }
}

export const getLogger = (prefix) => ({
  info: (...args) => write('info', prefix, args),
  error: (...args) => write('ERR!', prefix, args)
})
