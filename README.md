<p align="center">
  <img width="420px" src="https://raw.githubusercontent.com/suzukey/discord_transfer/main/docs/img/discord_transfer.png" alt='discord_transfer'>
</p>

<p align="center">
  <em>Discord voice transfer to other channel</em>
</p>

# discord_transfer

<p align="center">
  <img width="420px" src="https://raw.githubusercontent.com/suzukey/discord_transfer/main/docs/img/rendering_image.gif" alt='rendering image'>
</p>

## Requirements

Node 12+

## Run

Create `config/secrets.js` and set tokens

```
module.exports = {
  from_token: "<BOT_A_TOKEN>",
  to_token: "<BOT_B_TOKEN>"
}
```

Install dependencies & Run bots

```shell
$ npm install
$ npm run start
```

To start the bot in the current guild, Send `&trans` command in Discord

```
# Select channels and start the transfer
&trans

# Join by specifying the channel names argument
&trans [FromChannelName] [ToChannelName]

# Leave channels and end the transfer
&leave
```

<p align="center">&mdash; 📣 &mdash;</p>

<p align="center">
  <i>discord_transfer is licensed under the terms of the <a href="https://github.com/suzukey/discord_transfer/blob/main/LICENSE">MIT license</a>.</i>
</p>
