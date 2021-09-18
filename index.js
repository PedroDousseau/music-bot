import * as Discord from 'discord.js';
import * as commands from './commands/index.js';

const { PREFIX, TOKEN, MUSIC_CHANNEL } = process.env;

const client = new Discord.Client();

client.commands = new Discord.Collection();

// eslint-disable-next-line no-restricted-syntax
Object.values(commands).forEach((command) => {
  client.commands.set(command.name, command);
});

// eslint-disable-next-line no-console
client.once('ready', () => {
  console.log('Ready!');
});

// eslint-disable-next-line no-console
client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

// eslint-disable-next-line no-console
client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('message', async (message) => {
  // @@ Common verifications @@ //

  // if the message is from our own bot, ignore it
  if (message.author.bot) return;

  // Check if the message does not start with the prefix defined at config.json
  if (!message.content.startsWith(PREFIX)) return;

  // @@ Get command info @@ //
  const args = message.content.slice(PREFIX.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) {
    message.reply('Comando inválido meu chapa');
    return;
  }

  const command = client.commands.get(commandName);

  // @@Command-specific verifications@@ //
  if (command.guildOnly && !message.guild) {
    message.reply('Você precisa estar em um servidor para usar este comando');
    return;
  }

  // Check if the message was sent at the desired music channel defined at config.json
  if (command.musicChannelOnly && MUSIC_CHANNEL && message.channel.name !== MUSIC_CHANNEL) {
    message.delete();
    return;
  }

  // Check if user is in a voice channel
  if (command.userMustBeInVoiceChannel && !message.member.voice.channel) {
    message.channel.send('Você precisa estar em um canal de voz para usar este comando');
    return;
  }

  try {
    command.execute(message, args);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    message.reply('Comando inválido meu chapa');
  }
});

client.login(TOKEN);
