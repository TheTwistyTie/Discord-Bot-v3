const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DatabaseTables } = require('../enums');
const { addResource } = require('./addResource');

module.exports = { 
    async addResourceType(interaction) {
        let modal = new ModalBuilder()
            .setCustomId('addResourceTypeModal')
            .setTitle('Add resource type.');

        let typeNameInput = new TextInputBuilder()
            .setCustomId("typeNameInput")
            .setLabel("What type of resource would you like to add?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        let row = new ActionRowBuilder()
            .addComponents(typeNameInput)

        modal.addComponents(row)

        await interaction.showModal(modal)

        interaction.awaitModalSubmit({ time: 60_000 })
        .then(async modalInteraction => {
            let resourceTypeName = modalInteraction.fields.getTextInputValue('typeNameInput');

            let database = modalInteraction.client.database

            let resourceType
            try {
                let entry = await database.get(DatabaseTables.ResourceTypes).findOne({
                    where: {guildID: interaction.guild.id, name: resourceTypeName}
                })

                if(entry){
                    modalInteraction.reply({
                        content: "That is already a resource type.",
                        ephemeral: true
                    })
                    return null;
                }

                resourceType = await database.get(DatabaseTables.ResourceTypes).create({
                    guildID: interaction.guild.id,
                    name: resourceTypeName
                })

                let row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(resourceType.name)
                            .setLabel("Yes")
                            .setStyle(ButtonStyle.Success)
                    )

                let addResourceQuestion = await modalInteraction.reply({
                    content: `Resource type ${resourceType.name} has been added. Would you like to add ${resourceType.name} now?`,
                    components: [row],
                    ephemeral: true,
                    fetchReply: true
                })

                let collector = addResourceQuestion.createMessageComponentCollector();

                collector.on('collect', addResourceInteraction => {
                    const aR = require("./addResource")
                    aR.addResource(addResourceInteraction, [resourceType]);
                })
            } catch (err) {
                console.log(err)
                modalInteraction.reply({
                    content: "Failed to add resource type.",
                    ephemeral: true
                })
            }
        })
        .catch(err => console.log('No modal submit interaction was collected'));
    }
}

//add functions here