const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders")
const { ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { DatabaseTables } = require("../../enums");

module.exports = {
    name: 'spawnMenu',
    async execute(interaction) {
        const database = interaction.client.database;
        let rows = [];
        let row = new ActionRowBuilder();

        const roleButton = new ButtonBuilder()
            .setCustomId('setRoles')
            .setLabel('Set Roles')
            .setStyle(ButtonStyle.Secondary)

        const roles = await database.get(DatabaseTables.Roles).findAll({
            where: {guildID: interaction.guild.id}
        })

        if(roles) {
            row.addComponents(roleButton)
        }

        const resourceButton = new ButtonBuilder()
            .setCustomId('findResource')
            .setLabel('Find Resources')
            .setStyle(ButtonStyle.Secondary)

        const resources = await database.get(DatabaseTables.Resources).findAll({
            where: {guildID: interaction.guild.id}
        })

        if(resources) {
            row.addComponents(resourceButton)
        }

        rows.push(row);

        interaction.reply({
            content: 'What action would you like to do?',
            components: rows,
            ephemeral: true
        })
    }
}