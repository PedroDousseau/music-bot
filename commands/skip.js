const jukeboxes = require('../services/music/jukeboxes');

module.exports = {
  name: 'skip',
  description: 'skip a song',
  guildOnly: true,
  musicChannelOnly: true,
  userMustBeInVoiceChannel: true,
  execute(message, args) {
    const serverJukebox = jukeboxes.get(message.guild.id);

    if (serverJukebox) {
      const skipResult = serverJukebox.skip();
      if (skipResult) {
        message.channel.send(skipResult);
      }
    }
  },
};
