const { ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const {DatabaseTables} = require('../../../enums');

module.exports = {
    name: 'setRoles',
    async execute(interaction) {
        console.log("[Set Roles]")
        const database = interaction.client.database;
        const roleTypes = await database.get(DatabaseTables.RoleTypes).findAll({
            where: {guildID: interaction.guild.id}
        })

        if(roleTypes.length == 0) {
            interaction.reply({
                content: 'Roles have not been added yet.',
                ephemeral: true
            })
            return;
        }

        let rows = [];
        let c = 0;
        let l = 0;
        let currentRow = new ActionRowBuilder();
        for(let i = 0; i < roleTypes.length; i++) {
            if(c == 5){
                if(l == 4) {
                    break;
                }

                rows.push(currentRow)
                currentRow = new ActionRowBuilder();
                c = 0
                l++;
                console.log('new row');
            }

            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(roleTypes[i].id.toString())
                    .setLabel(`Set ${roleTypes[i].name} role`)
                    .setStyle(ButtonStyle.Success)
            )

            c++
        }
        rows.push(currentRow);
    
        let message = await interaction.reply({
            content: 'What type of role would you like to set?',
            components: rows,
            ephemeral: true,
            fetchReply: true
        })

        const collector = message.createMessageComponentCollector({componentType: ComponentType.Button})
        collector.on('collect', async i => {
            const type = i.customId;
            const roles = await database.get(DatabaseTables.Roles).findAll({
                where: {guildID: i.guild.id, roleTypeID: type}
            })

            let roleRows = [];
            let c = 0;
            let l = 0;
            let currentRow = new ActionRowBuilder();
            for(let i = 0; i < roles.length; i++) {
                if(c == 5){
                    if(l == 4){
                        break;
                    }

                    roleRows.push(currentRow)
                    currentRow = new ActionRowBuilder();
                    c = 0
                    l++;
                }

                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(roles[i].roleID)
                        .setLabel(roles[i].name)
                        .setStyle(ButtonStyle.Success)
                )

                c++
            }
            roleRows.push(currentRow);

            let roleMessage = await i.reply({
                content: 'Select your role:',
                components: roleRows,
                ephemeral: true,
                fetchReply: true
            })
            
            const roleCollector = roleMessage.createMessageComponentCollector({componentType: ComponentType.Button});
            roleCollector.on('collect', async roleInt => {
                let roleID = roleInt.customId;
                const RoleType = await database.get(DatabaseTables.RoleTypes).findOne({
                    where: {id: type}
                })

                if(!RoleType.allowMultiple) {
                    await roleInt.member.roles.remove(roles.map(role => role.roleID))
                }

                let memberRoles = roleInt.member.roles;
                if(memberRoles.cache.has(roleID)){
                    await roleInt.member.roles.remove(roleID);
                    roleInt.reply({
                        content: `Removed <@&${roleID}>`,
                        ephemeral: true
                    })
                } else {
                    await roleInt.member.roles.add(roleID);
                    roleInt.reply({
                        content: `Added <@&${roleID}>`,
                        ephemeral: true
                    })
                }
            })
        })
    }
}