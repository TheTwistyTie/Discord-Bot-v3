const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('clearroles')
    .setDescription('Clears all deleteable roles from server.'),
    async execute(interaction) {
        let message = await interaction.reply("Deleting...")

        interaction.guild.roles.cache.forEach(async role => {
            if(role.managed || role.rawPosition == 0){
                return;
            }

            await role.delete()
        })

        message.delete();
    }
}