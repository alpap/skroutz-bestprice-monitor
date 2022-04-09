import fs from 'fs'
import cheerio from 'cheerio'
import axios from 'axios'
import chalk from 'chalk'
import moment from 'moment'
import Discord from 'discord.js'
import SlackNotify from 'slack-notify'
import settings from './config.js'

// A message will be sent to this webhook when the product reaches the threshold price or lower
// The id is the first part code of the URL you get when creating a webhook in a channel
// init discord

const slack = SlackNotify(settings.slack_webhook_url)
var slack_notify = slack.extend({
  channel: settings.slack_webhook_url,
  icon_emoji: ':computer:',
  username: settings.slack_username,
})

const webhook = new Discord.WebhookClient(settings.discord_webhook_id, settings.discord_webhook_token)

const interval = 1000 * settings.check_every_seconds

// The name of the log file
const logFile = 'log.txt'

function sleep(milliseconds) {
  var start = new Date().getTime()
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break
    }
  }
}

const checkSkroutz = (url, name, threshold) => {
  axios
    .get(url)
    .then((response) => {
      const $ = cheerio.load(response.data)

      let prods = []
      $('.dominant-price').each((i, elem) => {
        prods.push(elem.children[0].data.split(' ')[0])
      })
      if (prods.length > 0) {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [x${prods.length}] [${name}] :: ${chalk.green('IN STOCK')}`)
        fs.appendFileSync(logFile, `[${moment().format('HH:mm:ss')}] info:: [skroutz] [x${prods.length}] [${name}] :: IN STOCK\n`)
      } else {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [x0] [${name}] :: ${chalk.red('OUT OF STOCK')}`)
        fs.appendFileSync(logFile, `[${moment().format('HH:mm:ss')}] info :: [skroutz] [x0] [${name}] :: OUT OF STOCK\n`)
      }

      const lowest = parseInt(prods.sort()[0])
      if (lowest <= threshold) {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [${name}] :: ${chalk.green('REACHED THRESHOLD')} [${lowest}€]`)
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: ${chalk.blue('SENDING WEBHOOK...')}`)
        const data = `${name} ${lowest}€ is in stock at: \n ${url}`
        slack_notify({
          text: name,
          fields: {
            value: `${lowest}€`,
            url: url,
          },
        }).catch(console.error)
      }
    })
    .catch((error) => {
      console.log(error)
    })
}
settings.products.map((product, index) => {
  setTimeout(() => {
    checkSkroutz(product.url, product.name, product.lower_then_threshold)
  }, 5000 * (index + 1))
  // How many seconds to wait before checking availability
  // Set it atleast 5 as to not get IP banned since i haven't implemented proxies
})
setInterval(() => {
  settings.products.map((product, index) => {
    setTimeout(() => {
      checkSkroutz(product.url, product.name, product.lower_then_threshold)
    }, 5000 * (index + 1))
    // How many seconds to wait before checking availability
    // Set it atleast 5 as to not get IP banned since i haven't implemented proxies
  })
}, interval)
