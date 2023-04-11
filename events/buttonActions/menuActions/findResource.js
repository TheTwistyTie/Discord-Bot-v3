const { ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { addResource } = require('../../../actions/addResource');
const { addResourceType } = require('../../../actions/addResourceType');
const {DatabaseTables} = require('../../../enums');
const Sequelize = require('sequelize');
const { getResourceTypeButtons } = require('../../../shared/getResourceTypeButtons');
const { viewResources } = require('../../../actions/viewResources');
const Op = Sequelize.Op;

let canEdit;
module.exports = {
    name: 'findResource',
    async execute(interaction) {
        console.log("[Find Resource]")
        const database = interaction.client.database;

        const resourceTypes = await database.get(DatabaseTables.ResourceTypes).findAll({
            where: {guildID: interaction.guild.id}
        })

        const resources = await database.get(DatabaseTables.Resources).findAll({
            where: {guildID: interaction.guild.id, finished: true}
        });


        let editors = await database.get(DatabaseTables.Roles).findAll({
            where: {guildID: interaction.guild.id, canEditResources: true}
        })

        canEdit = await interaction.member.roles.cache.some(r => editors.map(e => e.roleID).includes(r.id));

        if(resourceTypes.length == 0 || resources.length == 0) {

            let roleCount = interaction.member.roles.length;

            if(!canEdit) {
                interaction.reply({
                    content: 'No resources have been added yet. Please ask an admin when they will be added.',
                    ephemeral: true
                })
                return
            }

            let row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("confirm")
                        .setLabel("Yes")
                        .setStyle(ButtonStyle.Success)
                )
            
            let message = await interaction.reply({
                content: "There is nothing to show users yet. Would you like to add something now?",
                components: [row],
                ephemeral: true,
                fetchReply: true
            })

            let collector = message.createMessageComponentCollector();

            collector.on('collect', collectorInteraction => {
                if(resourceTypes.length == 0) {
                    addResourceType(collectorInteraction);
                } else {
                    addResource(collectorInteraction, resourceTypes);
                }
            })
            return
        }

        let rowsObj = getResourceTypeButtons(resources, resourceTypes, canEdit)
        let rows = rowsObj.rows

        if(canEdit) {
            if(resourceTypes.length < 25) {
                let addButton = new ButtonBuilder()
                    .setCustomId("addResourceType")
                    .setLabel("+")
                    .setStyle(ButtonStyle.Success)

                if(rows[rows.length - 1].components.length != 5) {
                    rows[rows.length - 1].addComponents(addButton);
                } else {
                    let row = new ActionRowBuilder().addComponents(addButton)
                    rows.push(row);
                }
            }
        }

        let message = await interaction.reply({
            content: "What kind of resource are you looking for?",
            components: rows,
            ephemeral: true,
            fetchReply: true
        })

        let collector = message.createMessageComponentCollector();

        collector.on("collect", async searchInteraction => {
            let kind = searchInteraction.customId;

            if(kind == "addResourceType") {
                addResourceType(searchInteraction)
                return
            }

            let filteredResourcesData = rowsObj.sortedResources[kind];
            console.log(kind)
            console.log(rowsObj.sortedResources)
            console.log(filteredResourcesData)

            let savedResources = await database.get(DatabaseTables.SavedResources).findAll({
                where: {guildID: searchInteraction.guild.id, resourceID: {
                    [Op.in]: filteredResourcesData.map(r => r.id)
                    },
                    userID: searchInteraction.member.id
                }
            })

            let findButton = new ButtonBuilder()
                .setCustomId("viewResources")
                .setLabel(`Find ${kind}`)
                .setStyle(ButtonStyle.Primary)

            let savedButton = new ButtonBuilder()
                .setCustomId("viewSavedResources")
                .setLabel(`Saved ${kind}`)

            savedResources.length > 0 ? savedButton.setStyle(ButtonStyle.Primary) : savedButton.setStyle(ButtonStyle.Secondary).setDisabled(true)

            let row = new ActionRowBuilder()
                .addComponents(findButton, savedButton)

            let addButton = new ButtonBuilder()
                .setCustomId("addNewResource")
                .setLabel(`Create new ${kind}`)
                .setStyle(ButtonStyle.Primary)

            if(canEdit) {
                row.addComponents(addButton);
            }
            
            let searchMessage = await searchInteraction.reply({
                content: `${kind}:`,
                components: [row],
                ephemeral: true,
                fetchReply: true
            })

            let decisionCollector = searchMessage.createMessageComponentCollector()

            decisionCollector.on("collect", async decisionInteraction => {
                let type = await database.get(DatabaseTables.ResourceTypes).findOne({
                    where: {guildID: decisionInteraction.guild.id, name: kind}
                })

                switch(decisionInteraction.customId) {
                    case "viewResources":
                        viewResources(decisionInteraction, type)
                        break;
                    case "viewSavedResources":
                        break;
                    case "addNewResource":
                        addResource(decisionInteraction, [type])
                        break;
                }
            })
        })
    }
}