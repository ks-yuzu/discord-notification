import Discord from 'discord.js'
import retry from 'async-retry'


export default class DiscordNotification {
  private botToken
  private maxRetry
  private verbose

  private discord
  private isExplicitlyInitialized = false // init() したフラグ. true の時は明示的に destroy する必要あり
                                          // (discord.js オブジェクトが handler を握り続ける問題防止用)

  constructor({botToken, verbose, maxRetry}:
              {botToken: string, verbose?: boolean, maxRetry?: number}) {
    this.botToken = botToken
    this.verbose  = verbose  ?? false
    this.maxRetry = maxRetry ?? 5
    this.discord  = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]})
  }

  public async init() {
    await this._init()
    this.isExplicitlyInitialized = true
  }

  private async _init() {
    const waitForReady = new Promise(r => this.discord.on('ready', r))
    await this.discord.login(this.botToken)
    await waitForReady
  }

  public async destroy() {
    await this._destroy()
  }

  private async _destroy() {
    await this.discord.destroy()
  }

  public async post({channel: channelName, username, text, iconUrl, files}:
                    {channel: string, username: string, text: string, iconUrl: string, files: string[]}) {
    if ( !this.isExplicitlyInitialized ) { await this._init() }

    const onRetry = (err: Error, i: number) => {
      if (!err) { return }
      console.log(`error: ${err}`)
      console.log(`[${i}] retry...`)
    }

    await retry(
      async () => await this._post({channelName, username, text, iconUrl, files}),
      {onRetry, retries: this.maxRetry}
    )

    // init() されていなければ destroy しておく (handler が残ってプロセスが終了しなくなるのを防ぐ)
    if ( !this.isExplicitlyInitialized ) {
      await this._destroy()
    }
  }

  private async _post({channelName, username, text, iconUrl, files}:
                      {channelName: string, username: string, text: string, iconUrl: string, files: string[]}) {
    const channel = await this._getTextChannelByName(channelName)
    if (this.verbose) {
      console.log({channel})
    }
    if (channel == null) { throw new Error(`Failed to find discord channel: ${channelName}`) }

    const webhook = await this._getWebhookForChannel(channel)
    if (this.verbose) {
      console.log({webhook})
    }
    if (webhook == null) { throw new Error(`Failed to find and create webhook for ${channelName}`) }

    await webhook.send({
      username,
      content: text,
      avatarURL: iconUrl,
      files,
    })
  }

  private async _getTextChannelByName(channelName: string): Promise<Discord.TextChannel | null> {
    const isTextChannel = (ch: Discord.AnyChannel):
      ch is Discord.TextChannel => ch?.constructor?.name === 'TextChannel'

    const channel = this.discord.channels.cache.find((ch: Discord.AnyChannel) => {
      return isTextChannel(ch) && ch.name === channelName
    })
    if (channel != null) { return channel as Discord.TextChannel }

    await new Promise(r => setTimeout(r, 500))
    if (this.verbose) {
      console.log('Retry fetch channel metadata')
    }

    return null
  }

  private async _getWebhookForChannel(channel: Discord.TextChannel) {
    const webhooks = await channel.fetchWebhooks()
    if (webhooks.size > 0) { return webhooks.at(0) } // 作成済みならそれを返す

    console.log('Creating new webhook...')
    return await channel.createWebhook(channel.name, {reason: 'twitter2discord'})
  }
}
