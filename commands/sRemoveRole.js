const { SlashCommandBuilder, Colors, PermissionFlagsBits, ActionRowBuilder, SelectMenuOptionBuilder, StringSelectMenuBuilder, ComponentType, Message, MessageComponentInteraction } = require("discord.js");
const { DatabaseTables } = require("../enums");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove the selected role type.')
        .addStringOption(option =>
            option.setName('roletype')
                .setDescription('The role type of the role you are removing.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const roleType = interaction.options.getString('roletype')

        const database = interaction.client.database;

        try {
            let dbRoleTypeID = await database.get(DatabaseTables.RoleTypes).findOne({
                where: {guildID: interaction.guild.id, name: roleType}
            })

            let roleTypeID = dbRoleTypeID.id

            if(roleTypeID.length == 0) {
                throw "No roleTypeID was found."
            }
            
            let roles = await database.get(DatabaseTables.Roles).findAll({
                where: {guildID: interaction.guild.id, roleTypeID: roleTypeID}
            });

            if(roles.length == 0) {
                throw "Now roles where found."
            }

            let roleOptions = []
            for(let i = 0; i < roles.length; i++){
                roleOptions.push({
                    label: roles[i].name,
                    value: roles[i].roleID
                });
            }

            let row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('roleDeleteSelect')
                    .setPlaceholder('Select the role(s) to remove.')
                    .addOptions(roleOptions)
                    .setMaxValues(roleOptions.length)
            )

            let message = await interaction.reply({
                content: `${roleType} roles:`,
                components: [row],
                ephemeral: true,
                fetchReply: true
            })

            let collector = message.createMessageComponentCollector() //{componentType: ComponentType.StringSelect}

            collector.on('collect', collectInteraction => {
                let values = collectInteraction.values

                let guild = collectInteraction.guild;
                for (let i = 0; i < values.length; i++) {
                    guild.roles.cache.find(role => role.id == values[i]).delete();

                    if(guild.roles.cache.find(role => role.id == values[i]).length > 0) {
                        throw "Failed to delete role."
                    }
                }

                database.get(DatabaseTables.Roles).destroy({
                    where: {roleID: {
                        [Op.in]: values
                      }
                    }
                })

                collectInteraction.reply({
                    content: "Role(s) removed.",
                    ephemeral: true
                })
            })
        } catch (error) {
            console.log(error)
            let errorMsg = await interaction.channel.send({
                content: 'An error has occured.'
            })

            setTimeout(() => {
                errorMsg.delete()
            }, 2500)
        }
    }
}