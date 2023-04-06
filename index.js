const { Client, Intents } = require('discord.js');
const translate = require('@iamtraction/google-translate');
const db = require('quick.db');
const config = require('./config');
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES
    ]
});
const prefix = config.prefix


client.on('ready', () => {
    console.log(`Hello ${client.user.tag}`);
    const channelId = db.get('translationChannelId');
    if (channelId) {
        console.log(`Automatic translation channel set to ${channelId}`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setchannel') {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Vous devez être administrateur pour utiliser cette commande.');
        }
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply('Veuillez mentionner un channel valide.');
        }
        db.set('translationChannelId', channel.id);
        message.reply(`Le channel de traduction automatique a été défini sur ${channel}.`);
    }

    if (command === 'translate') {
        if (!args.length) {
            return message.reply('Vous devez fournir un texte à traduire!');
        }

        const query = args.join(' ');
        try {
            const translated = await translate(query, { to: 'en' }); // change 'en' pour chnager la langue ...
            message.reply(`Traduction : ${translated.text}`);

            
            const translationChannelId = db.get('translationChannelId');
            if (translationChannelId && message.channel.id !== translationChannelId) {
                const translationChannel = message.guild.channels.cache.get(translationChannelId);
                if (translationChannel) {
                    translationChannel.send(`Traduction pour ${message.author.tag} : ${translated.text}`);
                }
            }
        } catch (error) {
            console.error(error);
            message.reply('Une erreur s\'est produite lors de la traduction.');
        }
    }
});

client.login(config.token);
