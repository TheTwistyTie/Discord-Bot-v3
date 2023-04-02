const { SlashCommandBuilder } = require("discord.js");
const { DatabaseTables } = require("../enums");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlockdown')
        .setDescription('Toggles whether a channel is set to locked at the Lockdown time.'),
    async execute(interaction) {
        const database = interaction.client.database;

        try {
            let search = await database.get(DatabaseTables.LockdownChannelIDs).findOne({
                where: {channelID: interaction.channel.id}
            })

            if(search){
                const dbTable = await database.get(DatabaseTables.LockdownChannelIDs)

                let rowCount = dbTable.destroy({
                    where: {channelID: interaction.channel.id}
                })

                if (rowCount) {
                    interaction.reply({
                        content: `Removed channel from the Lockdown List.`,
                        ephemeral: true
                    })
                    return false;
                };
            } else {
                let rowCount = database.get(DatabaseTables.LockdownChannelIDs).create({
                    guildID: interaction.guild.id,
                    channelID: interaction.channel.id
                })

                if (rowCount) {
                    interaction.reply({
                        content: `Added channel to the Lockdown List.`,
                        ephemeral: true
                    })
                    return false;
                };
            }

            console.log("[ERROR] Lockdown channel was neither added nor removed. This shouldn't be possible.");
            
            interaction.reply({
                content: 'An error has occured.',
                ephemeral: true
            })
        } catch (error) {
            console.log(error);
            interaction.reply({
                content: 'An error has occured.',
                ephemeral: true
            })
        }
    }
}
