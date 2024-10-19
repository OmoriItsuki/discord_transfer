const discord = require("discord.js")
const { Silence } = require("./audio")
const AudioMixer = require("audio-mixer")
const { createAudioPlayer, createAudioResource, StreamType, demuxProbe, EndBehaviorType, NoSubscriberBehavior } = require("@discordjs/voice")
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
      sampleRate: 48000
    })

    const audioResource = createAudioResource(mixer, {
      inputType: StreamType.Raw,
    })
    const audioPlayer = createAudioPlayer({
      behaviors: {
        // 聞いている人がいなくても音声を中継してくれるように設定
        noSubscriber: NoSubscriberBehavior.play,
      },
    })
    this.connection.to.subscribe(audioPlayer)
    audioPlayer.play(audioResource)
    this.audioMixer = mixer
    this.connection.from.receiver.speaking.on("start", (user) => {
      console.log("しゃべってます")
      if (this.audioMixer == null) {
        throw "audioMixer is null"
      } else {
        const stream = this.connection.from.receiver.subscribe(user, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000
          },
          destroy:() => {
            console.log("しゃべり終わ２")
            if (this.audioMixer != null) {
              this.audioMixer.removeInput(standaloneInput)
              standaloneInput.destroy()
              stream.destroy()
              p.destroy()
            }
          },
          autoDestroy:true,

        })

        const standaloneInput = new AudioMixer.Input({
          channels: 2,
          bitDepth: 16,
          sampleRate: 48000,
          volume: 80
        })
        this.audioMixer.addInput(standaloneInput)
        const p = stream.pipe(standaloneInput)
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
