const { SlashCommandBuilder, PermissionFlagsBits, roleMention, Colors } = require('discord.js');
const {RoleTypes, DatabaseTables} = require('../enums');
const { getColorOptions } = require('../shared/getColorsAsOptions');
const { addRole } = require('./sAddRole');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('addroletype')
        .setDescription('Add a role type.')
        .addStringOption(option =>
            option.setName('roletype')
                .setDescription('The role type you are adding.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the role.')
                .addChoices(
                    ...getColorOptions()
                )
        )
        .addBooleanOption(option =>
            option.setName('allowmultiple')
                .setDescription('Allow users to have more that one role from this category.')    
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const roleType = interaction.options.getString('roletype');
        const color = interaction.options.getString('color');
        const allowMultiple = interaction.options.getBoolean('allowmultiple');
        await this.addType(roleType, interaction, {
            color: color,
            allowMultiple: allowMultiple
        })
    },
    async addType(roleType, interaction, options) {
        try {
            const client = interaction.client;
            const RoleTypes = await client.database.get(DatabaseTables.RoleTypes).findOne({
                where: {guildID: interaction.guild.id, name: roleType}
            })

            if(RoleTypes) {
                return await interaction.reply(`${roleType} already exists.`)
            }

            const type = await client.database.get(DatabaseTables.RoleTypes).create({
                guildID: interaction.guild.id,
                name: roleType,
                color: options.color || Colors.Blurple,
                allowMultiple: options.allowMultiple || true
            })

            if(!options.roleName) {
                return await interaction.reply({
                    content: `Added ${roleType}`,
                    ephemeral: true
                });
            }

            await addRole(options.roleName, type, interaction);
        } catch (e) {
            console.log(e);
            await interaction.reply({
                content: 'An error occured.',
                ephemeral: true
            })
        }
    }
} 