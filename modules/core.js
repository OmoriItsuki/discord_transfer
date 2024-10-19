const discord = require("discord.js")
const { Silence } = require("./audio")
const AudioMixer = require("audio-mixer")
const { createAudioPlayer, createAudioResource, StreamType, demuxProbe, EndBehaviorType, NoSubscriberBehavior } = require("@discordjs/voice")
const Prism = require('prism-media')
const {PassThrough} = require('stream')

class Transfer {
  from = null
  to = null
  guilds = {}

  constructor() {
    this.from = new discord.Client({ intents: [
      "GUILDS",
      "GUILD_MESSAGES",	
      "GUILD_VOICE_STATES",	
    ]})
    this.to = new discord.Client({ intents:[
      "GUILDS",
      "GUILD_MESSAGES",
      "GUILD_VOICE_STATES",
    ]})
  }

  login = async (from_token, to_token) => {
    this.from.login(from_token)
    this.to.login(to_token)
  }

  connect = (from_connection, to_connection) => {
    const guild = new Guild(from_connection, to_connection)
    this.guilds[guild.id] = guild
  }

  leave = (guild_id) => {
    if (!(guild_id in this.guilds)) return
    this.guilds[guild_id].leave()
    delete this.guilds[guild_id]
  }
}

class Guild {
  id = ""
  connection = {
    from: null,
    to: null
  }
  volumes = {}
  audioMixer = null

  constructor(from_connection, to_connection) {
    // console.log(from_connection)
    // console.log(to_connection)

    const from_config = from_connection.joinConfig
    const to_config = to_connection.joinConfig

    // 参加したサーバーが違う
    if (from_config.guildId !== to_config.guildId) 
      throw "construct error"

    // 参加したボイスチャンネルが同じ
    if (from_config.channelId === to_config.channelId) 
      throw "construct error"

    this.id = from_config.guildId
    this.connection = {
      from: from_connection,
      to: to_connection
    }

    this.connection.from.playOpusPacket(new Silence())
    this.connection.to.playOpusPacket(new Silence())

    const mixer = new AudioMixer.Mixer({
      channels: 2,
      bitDepth: 16,
      sampleRate: 48000,
      clearInterval: 250,
    })

    this.audioMixer = mixer
    this.connection.from.receiver.speaking.on("start", (user) => {
      console.log("しゃべってます:", user)
      if (this.audioMixer == null) {
        throw "audioMixer is null"
      } else {
        const stream = this.connection.from.receiver.subscribe(user, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100
          },
        })

        const standaloneInput = new AudioMixer.Input({
          channels: 2,
          bitDepth: 16,
          sampleRate: 48000,
          volume: 80
        })

        const rawStream = new PassThrough();

        this.audioMixer.addInput(standaloneInput)
        
        stream
          .pipe(new Prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
          }))
          .pipe(
            rawStream
          )

        const p = rawStream.pipe(standaloneInput)

        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
          },
        });

        const resource = createAudioResource(mixer, {
          inputType: StreamType.Raw,
        })

        player.play(resource);
        this.connection.to.subscribe(player);

        rawStream.on("end", async () => {
          console.log("end:" + user)
          if (this.audioMixer != null) {
            this.audioMixer.removeInput(standaloneInput)
            standaloneInput.destroy()
            rawStream.destroy()
            p.destroy()
          }
        })
      }
    })
  }

  leave = async () => {
    this.connection.from.disconnect()
    this.connection.to.disconnect()
    this.audioMixer.close()
  }
}

module.exports = {
  Transfer
}
