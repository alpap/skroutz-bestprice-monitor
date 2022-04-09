export default {
  enable_slack: true,
  enable_discord: false,
  discord_webhook_id: '',
  discord_webhook_token: '',
  slack_webhook_url: '',
  slack_channel: '#statistics',
  slack_username: 'Statistics',
  products: [
    {
      name: 'AMD Ryzen 5 5600X',
      url: 'https://www.skroutz.gr/s/25549852/AMD-Ryzen-5-5600X-Box.html',
      lower_then_threshold: 350,
    },
  ],
  check_every_seconds: 3600,
}
