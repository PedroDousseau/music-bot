const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core-discord');

const { // Settings at config.json
    prefix,
    token,
} = require('./config.json');

const commands = [ // Valid commands
    {
        name: "play",
        execute: execute,
    },
    {
        name: "skip",
        execute: skip,
    },
    {
        name: "stop",
        execute: stop,
    },
]

let userMessage = "";
//const serverQueue = "";
const queue = new Map(); // Music queue



client.login(token);

client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});

//Aux functions
function getCommandMethod(msgContent) {
    for (let command of commands) {
        if (msgContent.startsWith(`${prefix}${command.name}`)) {
            return command.execute;
        }
    }
    return false;
}

client.on('message', async message => {

    // if the message is from our own bot, ignore it
    if (message.author.bot) return;

    // Voice only works in guilds, if the message does not come from a guild, we ignore it
    if (!message.guild) return;

    // Check if the message does not start with the prefix defined at config.json
    if (!message.content.startsWith(prefix)) return;

    userMessage = message;
    const msgContent = message.content;

    // Check if command exists and execute its function
    const methodToExecute = getCommandMethod(msgContent);
    if (methodToExecute) {
        methodToExecute();
    } else {
        message.channel.send('Comando inválido meu chapa')
    }

});

async function execute() {
    const serverQueue = queue.get(userMessage.guild.id);
    const args = userMessage.content.split(' ');

    // Check if user is in a voice channel
    const voiceChannel = userMessage.member.voice.channel;
    if (!voiceChannel) {
        return userMessage.channel.send('Você precisa estar em um canal de voz para solicitar músicas!')
    }

    // Check if the bot has the right permission
    const permissions = voiceChannel.permissionsFor(userMessage.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return userMessage.channel.send('Preciso de permissão para entrar e falar no server!');
    }

    // Get the song info and save it into a song object
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };

    // Check if serverQueue is already defined
    if (!serverQueue) {

        // Creating the contract for our queue
        const queueContruct = {
            textChannel: userMessage.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        // Setting the queue using our contract
        queue.set(userMessage.guild.id, queueContruct);

        // Pushing the song to our songs array
        queueContruct.songs.push(song);

        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;

            // Calling the play function to start a song
            play(userMessage.guild, queueContruct.songs[0]);

        } catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            queue.delete(userMessage.guild.id);
            return userMessage.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return userMessage.channel.send(`${song.title} foi adicionado à fila!`);
    }
}

async function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    // Checks if the song is empty
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(await ytdl(song.url), { type: 'opus' })
        .on('finish', () => {
            // Deletes the finished song from the queue
            serverQueue.songs.shift();

            // Calls the play function again with the next song
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        });
    //dispatcher.setVolume(serverQueue.volume / 5);
}

function skip() {
    const serverQueue = queue.get(userMessage.guild.id);
    if (!userMessage.member.voice.channel) {
        return userMessage.channel.send('Você precisa estar em um canal de voz para solicitar músicas!');
    }
    if (!serverQueue) {
        return userMessage.channel.send('Não há músicas para ser skipadas!');
    }
    serverQueue.connection.dispatcher.destroy();
}

function stop() {
    const message = userMessage;
    const serverQueue = queue.get(userMessage.guild.id);

    if (!message.member.voice.channel) return message.channel.send('Você precisa estar em um canal de voz para pausar músicas!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}