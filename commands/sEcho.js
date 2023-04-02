const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Replies with your input!')
    .addStringOption(option =>
		option.setName('input')
			.setDescription('The input to echo back')
			// Ensure the text will fit in an embed description, if the user chooses that option
			.setMaxLength(2000))
	.addChannelOption(option =>
		option.setName('channel')
			.setDescription('The channel to echo into')
			// Ensure the user can only select a TextChannel for output
			.addChannelTypes(ChannelType.GuildText))
	.addBooleanOption(option =>
		option.setName('emphemeral')
			.setDescription('Whether or not the echo should be ephemeral')),
    async execute(interaction) {
        const strInput = interaction.options.getString('input')
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const ehepmeral = interaction.options.getBoolean('ephemeral') ?? false

        await channel.send({content: strInput, ephemeral: ehepmeral});
        await interaction.reply({content: "Sent!", ephemeral: true});
    }
}