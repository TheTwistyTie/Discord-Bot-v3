const { SlashCommandBuilder, Colors, PermissionFlagsBits } = require("discord.js");
const { DatabaseTables } = require("../enums");
const { getColorOptions } = require("../shared/getColorsAsOptions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changerolecolor')
        .setDescription('Change the color of a role type.')
        .addStringOption(option =>
            option.setName('roletype')
                .setDescription('The role type you are changing the color of.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color youre choosing.')
                .setRequired(true)
                .addChoices(...getColorOptions())    
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const color = interaction.options.getString('color')
        const roleType = interaction.options.getString('roletype')

        const database = interaction.client.database;

        try {
            const rowsAffected = await database.get(DatabaseTables.RoleTypes).update(
                {
                    color: parseInt(color)
                }, 
                {
                    where: {
                        guildID: interaction.guild.id,
                        name: roleType
                    }
                }
            )

            if(rowsAffected < 1) {
                interaction.reply({
                    content: `Failed to update color.`,
                    ephemeral: true
                })
                return;
            }

            const RoleType = await database.get(DatabaseTables.RoleTypes).findOne({
                where: {
                    guildID: interaction.guild.id,
                    name: roleType
                }
            })

            const Roles = await database.get(DatabaseTables.Roles).findAll({
                where: {
                    guildID: interaction.guild.id,
                    roleTypeID: RoleType.id
                }
            })

            const RoleIDs = Roles.map(role => role.roleID)
            console.log(RoleIDs);

            interaction.guild.roles.cache.forEach(role => {
                if(RoleIDs.includes(role.id)) {
                    console.log(`role ${role.name} has been changed.`)
                    role.edit({
                        color: parseInt(color)
                    })
                }    
            })

            interaction.reply({
                content: 'Changed the color.',
                ephemeral: true
            })
        } catch (error) {
            console.log(error)
            interaction.reply({
                content: 'An error has occured.',
                ephemeral: true
            })
        }
    }
}