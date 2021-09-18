import jukeboxes from '../services/music/jukeboxes.js';

const Queue = {
  name: 'queue',

  description: 'show the cong queue',

  guildOnly: true,

  musicChannelOnly: true,

  userMustBeInVoiceChannel: true,

  execute(message, args) {
    const serverJukebox = jukeboxes.get(message.guild.id);

    let songList = '';

    if (serverJukebox) {
      const queue = serverJukebox.getSongs();

      queue.forEach((song) => {
        songList += `${song.title} \n`;
      });

      message.channel.send(songList || 'A fila está vazia');
    }
  },
};

export default Queue;
