import Jukebox from '../services/music/jukebox.js';
import jukeboxes from '../services/music/jukeboxes.js';

const Play = {
  name: 'play',
  description: 'play a song on server',
  guildOnly: true,
  musicChannelOnly: true,
  userMustBeInVoiceChannel: true,
  async execute(message, args) {
    let serverJukebox = jukeboxes.get(message.guild.id);

    if (!serverJukebox) {
      serverJukebox = new Jukebox(message.channel, message.member.voice.channel);
      jukeboxes.set(message.guild.id, serverJukebox);
    }

    // Check if the bot has the right permission
    const permissions = serverJukebox.voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      message.channel.send('Preciso de permissão para entrar e falar no server!');
      return;
    }

    // Check if the bot is already in channel
    if (!serverJukebox.connection) {
      try {
        const connection = await serverJukebox.voiceChannel.join();
        serverJukebox.connection = connection;
      } catch (err) {
        message.channel.send('Não foi possível entrar no canal de voz');
        return;
      }
    }

    // Check if the music an URL or a string
    let key = args[0];
    let videoUrl;

    const urlPattern = new RegExp(
      '^(https?:\\/\\/)?' // protocol
        + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
        + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
        + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
        + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
        + '(\\#[-a-z\\d_]*)?$',
      'i',
    );

    if (!urlPattern.test(key)) {
      key = args.join(' ');
      videoUrl = await serverJukebox.getVideoUrlByKey(key);
    } else {
      videoUrl = key;
    }

    // Add the song to jukebox queue
    const addSongResult = await serverJukebox.addSongByUrl(videoUrl);
    message.channel.send(addSongResult);

    // Check if it is already playing
    if (!serverJukebox.isPlaying) {
      serverJukebox.play();
    }
  },
};

export default Play;
