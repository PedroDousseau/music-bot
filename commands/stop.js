const jukeboxes = require('../services/music/jukeboxes');

module.exports = {
  name: 'stop',
  description: 'stop the jukebox and clear the queue',
  guildOnly: true,
  musicChannelOnly: true,
  userMustBeInVoiceChannel: true,
  execute(message, args) {
    const serverJukebox = jukeboxes.get(message.guild.id);

    if (serverJukebox) {
      serverJukebox.stop();
    }
  },
};
