const fs = require('fs')
const cheerio = require('cheerio')
const axios = require('axios')
const chalk = require('chalk')
const moment = require('moment')
const Discord = require('discord.js')
const SlackNotify = require('slack-notify')
const settings = require('./config.js')

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

// How many seconds to wait before checking availability
// Set it atleast 5 as to not get IP banned since i haven't implemented proxies

const interval = seconds * settings.check_every_seconds

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
      $('.js-product-link.product-link.content-placeholder').each((i, elem) => {
        prods.push([elem.children[0].data, elem.attribs.href])
      })

      if (prods.length > 0) {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [x${prods.length}] [${productName}] :: ${chalk.green('IN STOCK')}`)
        fs.appendFileSync(logFile, `[${moment().format('HH:mm:ss')}] info:: [skroutz] [x${prods.length}] [${productName}] :: IN STOCK\n`)
      } else {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [x0] [${productName}] :: ${chalk.red('OUT OF STOCK')}`)
        fs.appendFileSync(logFile, `[${moment().format('HH:mm:ss')}] info :: [skroutz] [x0] [${productName}] :: OUT OF STOCK\n`)
      }

      lowest = parseInt(prods[0][0].substring(0, prods[0][0].length - 1).replace(',', '.'))

      if (lowest <= threshold) {
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: [skroutz] [${productName}] :: ${chalk.green('REACHED THRESHOLD')} [${lowest}€]`)
        console.log(`[${moment().format('HH:mm:ss')}] ${chalk.green('info')} :: ${chalk.blue('SENDING WEBHOOK...')}`)
        const data = `${name} is in stock at https://www.skroutz.gr${prods[0][1]} for ${lowest}€`
        if (settings.enable_slack) slack_notify({ text: data }).catch(console.error)
        if (settings.enable_discord) webhook.send(data).catch(console.error)
      }
    })
    .catch((error) => {
      console.log(error)
    })
}

setInterval(() => {
  settings.products.map((product) => {
    sleep(5000)
    checkSkroutz(product.url, product.name, product.lower_then_threshold)
  })
}, interval)
