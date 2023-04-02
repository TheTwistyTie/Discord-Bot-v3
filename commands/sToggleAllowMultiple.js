const { SlashCommandBuilder } = require("discord.js");
const { DatabaseTables } = require("../enums");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleallowmulitple')
        .setDescription('Toggles a users ability to have more than one of a role of a given role type.')
        .addStringOption(option =>
            option.setName('roletype')
                .setDescription('The role type you are toggling mulitples for.')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async execute(interaction) {
        const roleType = interaction.options.getString('roletype');

        const database = interaction.client.database;

        try {
            const RoleType = await database.get(DatabaseTables.RoleTypes).findOne({
                where: {
                    guildID: interaction.guild.id,
                    name: roleType
                }
            })

            if(RoleType.length == 0) {
                interaction.reply({
                    content: `Could not find role type of ${roleType}`,
                    ephemeral: true
                })
                return;
            }

            const rowCount = await RoleType.update({allowMultiple: !RoleType.allowMultiple});

            if(rowCount < 1) {
                interaction.reply({
                    content: 'An error has occured.',
                    ephemeral: true
                })
                return;
            }

            interaction.reply({
                content: `allowMultiple has been set to: ${RoleType.allowMultiple} for ${roleType}.`,
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