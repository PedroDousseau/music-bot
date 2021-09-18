import ytdl from 'ytdl-core-discord';
import axios from 'axios';

const { YOUTUBE_DATA_API_KEY } = process.env;

function Jukebox(textChannel, voiceChannel) {
  this.textChannel = textChannel;
  this.voiceChannel = voiceChannel;
  this.connection = null;
  this.songs = [];
  this.volume = 5;
  this.isPlaying = false;
}

Jukebox.prototype.addSongByUrl = async function addSongByUrl(url) {
  const songInfo = await ytdl.getInfo(url);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url,
  };
  this.songs.push(song);

  return `${song.title} foi adicionado à fila!`;
};

Jukebox.prototype.skip = function skip() {
  if (this.songs.length < 1 || !this.isPlaying) {
    return 'A fila de músicas está vazia!';
  }

  this.connection.dispatcher.end();
  return null;
};

Jukebox.prototype.stop = function stop() {
  this.songs = [];
  this.isPlaying = false;
  this.connection.dispatcher.end();
  this.connection = null;
};

Jukebox.prototype.getSongs = function getSongs() {
  return this.songs;
};

Jukebox.prototype.play = async function play() {
  const nextSong = this.songs[0];

  // Checks if the song is empty
  if (!nextSong) {
    this.voiceChannel.leave();
    this.connection = null;
    this.isPlaying = false;
    return;
  }

  this.isPlaying = true;
  this.connection
    .play(await ytdl(nextSong.url), { type: 'opus' })
    .on('finish', () => {
      // Deletes the finished song from the queue
      this.songs.shift();

      // Calls the play function again with the next song
      this.play();
    })
    .on('error', (error) => {
      this.isPlaying = false;

      // eslint-disable-next-line no-console
      console.error(error);
    });
};

Jukebox.prototype.getVideoUrlByKey = async function getVideoUrlByKey(key) {
  const endpoint = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_DATA_API_KEY}&type=video&maxResults=1&q=${encodeURIComponent(
    key,
  )}`;
  try {
    const response = await axios.get(endpoint);

    const { videoId } = response.data.items[0].id;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default Jukebox;
