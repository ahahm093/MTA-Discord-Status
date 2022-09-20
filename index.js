const DiscordSmith = require('discord.js');
const smithmta = require('gamedig');
const smithconfig = require('./config.json');

const smithbot = new DiscordSmith.Client({ intents: [DiscordSmith.Intents.FLAGS.GUILDS] });
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { config } = require('process');

const commands = [
	new SlashCommandBuilder().setName('server').setDescription('mta server status'),
    new SlashCommandBuilder().setName('player').setDescription('player in game'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(smithconfig.token);

smithbot.once('ready', () => {
    console.log(`Logged : ${smithbot.user.tag}`);
    setInterval(() => {
        smithmta.query({
            type: 'mtasa',
            host: smithconfig.server_ip,
            port: smithconfig.server_port
        }).then((state) => {
            smithbot.user.setActivity(`🟢 اللاعبين المتصلين : ${state.raw.numplayers}/${state.maxplayers}`);
        }).catch(err => {
            console.log(err);
        });
    }, 5000);
    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(smithbot.user.id, smithconfig.guildId),
                { body: commands },
            );
    
            console.log('Successfully registered application commands.');
        } catch (error) {
            console.error(error);
        }
    })();
});


smithbot.on('interactionCreate', async smithmsg => {
    if (!smithmsg.isCommand()) return;

    const { commandName } = smithmsg;

    if (commandName === 'server') {
        smithmta.query({
            type: 'mtasa',
            host: smithconfig.server_ip,
            port: smithconfig.server_port
        }).then(async (state) => {
            console.log(state)
            var smithembed = new DiscordSmith.MessageEmbed()
            .setTitle(state.name)
            .setColor(`red`)
            .addField(`الخريطة :`,` - ${state.map}`,true)
            .addField(`وصف اللعب :`,` - ${state.raw.gametype}`,true)
            .addField(`تم إنشاءه بواسطة :`,` - G99 NetWork`,true)
            .addField(`🟢 اللاعبين المتصلين :`,` - ${state.raw.numplayers}/${state.maxplayers}`,true)
            .addField(`سرعة الاستجابة :`,` - ${state.ping}ms`,true)
            .addField(`عنوان الايبي :`,` - ${state.connect}`,true)
            .setTimestamp()
            .setFooter(`Requested by ${smithmsg.member.user.tag}`,smithmsg.member.user.avatarURL());

            await smithmsg.reply({ embeds: [smithembed] });
        }).catch(err => {
            console.log(err);
        });
	} 
});

smithbot.login(smithconfig.token);
