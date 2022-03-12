import DiscordNotification from '../src/index'

function die(msg: string): never {
  throw new Error(msg)
}

const discord = new DiscordNotification({
  botToken: process.env.BOT_TOKEN || die('set env BOT_TOKEN'),
  // verbose:  true,
})

;(async () => {
  // await discord.init()
  await discord.post({
    channel:  'bot-info',
    username: 'Test',
    text:     'DiscordNotification Test',
    iconUrl:  'https://img.icons8.com/external-flatart-icons-outline-flatarticons/64/000000/external-check-twitter-flatart-icons-outline-flatarticons.png',
    files: [
      'https://img.icons8.com/external-flatart-icons-outline-flatarticons/64/000000/external-check-twitter-flatart-icons-outline-flatarticons.png',
    ],
  })
  // await discord.destroy()
})()
