import wol from 'wake_on_lan'
import http from 'http'
import WebSocket from 'ws'
import SSDP from 'node-ssdp'

import { logger } from 'appium-support'
import KEY_CODES from './constants.mjs'

const log = logger.getLogger('SamsungRemote')

const CONNECTION_TIMEOUT = 60000
const KEY_DELAY = 200
const WAKE_ON_LAN_DELAY = 5000
const UPNP_TIMEOUT = 1000

export default class SamsungTV {
  constructor (host, mac) {
    this.services = []
    this.host = host
    this.mac = mac
    this.api = `http://${this.host}:8001/api/v2/`
    this.wsapi = `wss://${this.host}:8002/api/v2/`
    this.token = null
    this.isConnected = false
  }

  /**
   * add UPNP service
   * @param [Object] service  UPNP service description
  */
  addService (service) {
    this.services.push(service)
  }

  /**
   * connect to device
   * @param [String] appName  name of remote control
  */
  async connect (appName = 'SamsungSmartTVDriver') {
    if (this.isConnected) {
      return Promise.resolve()
    }

    // make sure to turn on TV in case it is turned off
    if (this.mac) {
      await this.wol(this.mac)
    }

    // get device info
    this.info = await this.getDeviceInfo()

    // establish socket connection
    const appNameBase64 = Buffer.alloc(appName.length, appName).toString('base64')
    const channel = `${this.wsapi}channels/samsung.remote.control?name=${appNameBase64}${this.token ? '&token=' + this.token : ''}`
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    log.info(`Connecting to ${channel}`)
    this.ws = new WebSocket(channel)

    return new Promise((resolve, reject) => {
      this.ws.once('message', (data, flags) => {
        clearTimeout(this.timeout)

        try {
          data = JSON.parse(data)
        } catch (e) {
          log.error('Could not parse TV response', data)
          return reject(e)
        }

        if (data.data.token) {
          this.token = data.data.token
        }

        if (data.event !== 'ms.channel.connect') {
          const error = new Error('Unable to connect to TV')
          log.error(error.message)
          log.info('TV responded with', data)
          return reject(error)
        }

        log.info('Connection successfully established')
        this.isConnected = true
        resolve()
      })

      this.timeout = setTimeout(() => {
        const error = new Error('Unable to connect to TV: timeout')
        log.error(error.message)
        reject(error)
      }, CONNECTION_TIMEOUT)
    })
  }

  /**
   * turns on TV
  */
  wol (macAddress) {
    if (typeof macAddress !== 'string') {
      throw new Error('connectTo requires macAddress as first parameter')
    }

    log.info('Trying to wake up TV...')
    return new Promise((resolve, reject) => wol.wake(macAddress, (e) => {
      if (e) {
        log.error('Could not connect to device with mac address', macAddress, e.message)
        return reject(e)
      }
      log.info('TV is awake')
      return setTimeout(resolve, WAKE_ON_LAN_DELAY)
    }))
  }

  /**
   * disconnect from device
  */
  disconnect () {
    this.ws.close()
  }

  /**
   * send key to device
   * @param [String] key  key code
  */
  async sendKey (key) {
    if (typeof key !== 'string' || !Object.values(KEY_CODES).includes(key)) {
      throw new Error('Key code not available')
    }
    if (!this.isConnected) {
      throw new Error('Not connected to device. Call `tv.connect()` first!')
    }

    log.info('Send key command', key)
    this.ws.send(JSON.stringify({
      method: 'ms.remote.control',
      params: {
        Cmd: 'Click',
        DataOfCmd: key,
        Option: false,
        TypeOfRemote: 'SendRemoteKey'
      }
    }))

    // add a delay so TV has time to execute
    await new Promise((resolve) => setTimeout(resolve, KEY_DELAY))
  }

  /**
   * request TV info like udid or model name
  */
  getDeviceInfo () {
    log.info(`Getting device info from ${this.api}`)

    return new Promise((resolve, reject) => {
      // select http or https module, depending on reqested url
      const request = http.get(this.api, (response) => {
        // handle http errors
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Failed to load response, status code: ' + response.statusCode))
        }
        // temporary data holder
        const body = []
        // on every content chunk, push it to the data array
        response.on('data', (chunk) => body.push(chunk))
        // we are done, resolve promise with those joined chunks
        response.on('end', () => resolve(body.join('')))
      })
      // handle connection errors of the request
      request.on('error', (err) => reject(err))
    })
  }

  /**
   * static method to discover Samsung Smart TVs in the network using the UPNP protocol
  */
  static discover () {
    const client = new SSDP.Client()
    const tvs = []

    client.search('ssdp:all')
    client.on('response', (headers, statusCode, rinfo) => {
      /**
       * ignore other devices
      */
      if (!headers.SERVER.match(/.*?Samsung.+UPnP.+SDK\/1\.0/)) {
        return
      }

      let device = tvs.find((tv) => tv.host === rinfo.address)

      if (!device) {
        log.info('Found Samsung Smart TV on IP', rinfo.address)
        device = new SamsungTV(rinfo.address)
        tvs.push(device)
      }

      device.addService({
        location: headers.LOCATION,
        server: headers.SERVER,
        st: headers.ST,
        usn: headers.USN
      })
    })

    return new Promise((resolve, reject) => setTimeout(() => {
      if (tvs.length === 0) {
        return reject(
          new Error('No Samsung TVs found. Make sure the UPNP protocol is enabled in your network.')
        )
      }

      resolve(tvs)
    }, UPNP_TIMEOUT))
  }
}
