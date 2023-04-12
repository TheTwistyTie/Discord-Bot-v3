const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setname')
		.setDescription('Renames the bot for your server!')
        .addStringOption(option => 
            option.setName("botname")
                .setDescription("What you want the name to be.")
                .setRequired(true)    
        ),
	async execute(interaction) {
		let botName = interaction.options.getString("botname");

        let client = interaction.client
        let botMember = interaction.guild.members.cache.get(client.user.id)

        botMember.setNickname(botName)

        interaction.reply({
            content: "Set successfully.",
            ephemeral: true
        })
	},
};