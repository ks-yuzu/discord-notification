# is何
Discord でも Slack の webhook みたいに,
通知先や表示名・アイコンを指定しつつメッセージを投げるための discord.js のシンプルなラッパー

# 使い方
```sh
npm i git+https://github.com/ks-yuzu/discord-notification.git
```

```js
const discord = new DiscordNotification({
  botToken: <BOT_TOKEN>,
  // verbose:  true,
})

// 明示的に init() しなければ, 内部の discord.js オブジェクトは post 毎に destroy される
;(async () => {
  await discord.post({
    channel:  <CHANNEL_NAME>,
    username: <USER_NAME>,
    text:     <CONTENT>,
    iconUrl:  <ICON_URL>,
    files: [
      <ATTACHMENT_FILE_URL>,
    ],
  })
})()

// 明示的に init() すれば, 自動 destroy されなくなる (discord.js オブジェクトを使い回す) ので destroy する必要がある
// (destroy を忘れると discord.js オブジェクトが handler を持ったままになってプロセスが終了されなくなる)
;(async () => {
  await discord.init()
  await discord.post({
    channel:  <CHANNEL_NAME>,
    username: <USER_NAME>,
    text:     <CONTENT>,
    iconUrl:  <ICON_URL>,
    files: [
      <ATTACHMENT_FILE_URL>,
    ],
  })
  await discord.destroy()
})()
```
