const { ActionRowBuilder, SelectMenuBuilder } = require("@discordjs/builders");
const { TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ModalBuilder } = require("discord.js");
const { DatabaseTables, ComponentHandlerType } = require("../enums");
const { getPageHandler } = require("../objects/pageHandler");
const pageHandler = require("../objects/pageHandler");
const { getLongEmbed } = require("../shared/getLongEmbed");
const { getResourceTypeButtons } = require("../shared/getResourceTypeButtons");
const { looseEnd } = require("../shared/looseEnd");
const { addResourceType } = require("./addResourceType");

let _MainMessage;
let _Resource;
var _ResourceID;

module.exports = {
    addResource(interaction, resourceTypes) {
        if(resourceTypes.length == 1) {
            addResourceToType(resourceTypes[0].id, interaction)
        } else {
            getResourceType(interaction, resourceTypes)
        }
    },

    editResource(resource, interaction) {
        spawnDirectMessage(interaction, resource)
    }
}

async function addResourceToType(type, interaction) {
    let database = interaction.client.database;

    let modal = new ModalBuilder()
        .setCustomId('addResourceInitialModal')
        .setTitle('Add resource resource.')
        .addComponents(
            new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId("resourceNameInput")
                        .setLabel("What's the name of your resource?")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),

            new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("resourceDescriptionInput")
                            .setLabel("What is a description of your resource:")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
        )

    await interaction.showModal(modal)

    interaction.awaitModalSubmit({ time: 60_000 })
    .then(async modalInteraction => {
        let resourceName = modalInteraction.fields.getTextInputValue('resourceNameInput');
        let resourceDescription = modalInteraction.fields.getTextInputValue("resourceDescriptionInput");

        let resource = await database.get(DatabaseTables.Resources).create({
            guildID: interaction.guild.id,
            resourceTypeID: type,
            name: resourceName,
            description: resourceDescription
        })
        _ResourceID = resource.id

        modalInteraction.reply({
            content: `Please continue creating ${resource.name} in your Direct Messages. You can find them in the top left corner. There's a new message from me! :grin:`,
            ephemeral: true
        })

        spawnDirectMessage(modalInteraction, resource);
    }).catch(err => console.log('No modal submit interaction was collected'))
}

async function getResourceType(interaction, resourceTypes) {
    /*
    let database = interaction.client.database;

    let resourceTypes = await database[DatabaseTables.ResourceTypes].findAll({
        where: {guildID: interaction.guild.id}
    })
    */

    if(resourceTypes.length == 0) {
        let row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("confirm")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success)
            )

        let message = await interaction.reply({
            content: "There are no resource types. Would you like to add one?",
            components: [row],
            ephemeral: true,
            fetchReply: true
        })

        let collector = message.createMessageComponentCollector();

        collector.on('collect', collectorInteraction => {
            addResourceType(collectorInteraction);
        })
    } else {
        let resourceTypeOptions;
        for(let i = 0; i < resourceTypes.length; i++) {
            resourceTypeOptions.push({
                label: resourceTypes[i].name,
                value: resourceTypes[i].id
            })
        }

        if(resourceTypeOptions.length < 25) {
            resourceTypeOptions.push({
                label: "Add new",
                value: "new"
            })
        }

        let row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder({
                    custom_id: "selectResourceType",
                    placeholder: "Which resource type?",
                    options: resourceTypeOptions
                })
            )

        let message = await interaction.reply({
            content: "Which resource type are you adding?",
            components: [row],
            ephemeral: true,
            fetchReply: true
        })

        let collector = message.createMessageComponentCollector();

        collector.on("collect", collectInteraction => {
            if(collectInteraction.customId == "new") {
                addResourceType(collectInteraction);
            } else {
                addResourceToType(collectInteraction.customId, collectInteraction)
            }
        })
    }
}

async function spawnDirectMessage(interaction, resource) {
    _Resource = resource;
    let formatting = _Resource.finished ? "Editing" : "Creating"
    let database = interaction.client.database;

    _MainMessage = await interaction.user.send({
        content: `${formatting} resource ${_Resource.name}`,
        components: await getComponents(_Resource, database),
        embeds: [await getLongEmbed(_Resource, database)],
        fetchReply: true
    })

    let collector = _MainMessage.createMessageComponentCollector();

    collector.on('collect', async resourceEditInteraction => {
        let uniqueActionIds = [
            "editResourceTags",
            "editResourceRoles",
            "submitResource",
            "deleteResource",
            "cancel",
            "editResourceLinks"
        ]

        if(uniqueActionIds.includes(resourceEditInteraction.customId)){
            let rowCount;
            switch(resourceEditInteraction.customId) {
                case "submitResource":
                    rowCount = await interaction.client.database.get(DatabaseTables.Resources).update({finished: true}, {where: {id: _Resource.id}})

                    if(rowCount == 1) {
                        let submitMessage = await resourceEditInteraction.reply({
                            content: "Submitted!"
                        })

                        interaction.deleteReply();
                        _MainMessage.delete()

                        setTimeout(() => {
                            resourceEditInteraction.deleteReply();
                        }, 2500)
                    } else {
                        let errorMessage = await resourceEditInteraction.reply({
                            content: "Something went wrong. Please try again."
                        });

                        setTimeout(() => {
                            resourceEditInteraction.deleteReply()
                        }, 2500)
                    }
                    break;
                case "deleteResource":
                    rowCount = await interaction.client.database.get(DatabaseTables.Resources).destroy({where: {id: _Resource.id}})

                    if(rowCount == 1) {
                        _MainMessage.delete()

                        let submitMessage = await resourceEditInteraction.reply({
                            content: "Deleted."
                        })

                        interaction.deleteReply();

                        setTimeout(() => {
                            resourceEditInteraction.deleteReply();
                        }, 2500)
                    } else {
                        let errorMessage = await resourceEditInteraction.reply({
                            content: "Something went wrong. Please try again."
                        });

                        setTimeout(() => {
                            resourceEditInteraction.deleteReply()
                        }, 2500)
                    }
                    break;
                case "cancel":
                    await _MainMessage.delete()

                    let updatedMessage = await resourceEditInteraction.editReply({
                        content: "Cancled.",
                        components: [],
                        embeds: []
                    })
                
                    setTimeout(() => {
                        resourceEditInteraction.deleteReply()
                    }, 2500)
                    break;
                case "editResourceTags":
                case "editResourceRoles":
                    let Table;
                    let LinkTable;
                    let name;
                    let tableField;

                    switch(resourceEditInteraction.customId) {
                        case "editResourceTags":
                            Table = DatabaseTables.Tags
                            LinkTable = DatabaseTables.ResourceTags
                            name = "tags";
                            tableField = "tagID"
                            break;
                        case "editResourceRoles":
                            Table = DatabaseTables.Roles
                            LinkTable = DatabaseTables.ResourceRoles
                            name = "roles";
                            tableField = "roleID"
                            break;
                    }

                    let tageRoleOptions = await interaction.client.database.get(Table).findAll({
                        where: {guildID: _Resource.guildID}
                    })

                    let options = []
                    for(let i = 0; i < tageRoleOptions.length; i++ ) {
                        let whereData = {
                            guildID: _Resource.guildID
                        }
                        whereData[tableField] = tageRoleOptions[i].id

                        let dbLinks = await interaction.client.database.get(LinkTable).findAll({
                            where: whereData
                        })

                        options.push({
                            label: tageRoleOptions[i].name,
                            description: `(${dbLinks.length})`,
                            value: tageRoleOptions[i].id.toString()
                        })
                    }

                    if(name == "tags" && options.length < 25) {
                        options.push({
                            label: "Add new",
                            description: "You can have up to 25 tags!",
                            value: "addNew"
                        })
                    }

                    let row = new ActionRowBuilder()
                        .addComponents(
                            new SelectMenuBuilder()
                                .setCustomId("editResourceTagsSelect")
                                .setPlaceholder(`Choose ${name}`)
                                .addOptions(options)
                                .setMaxValues(options.length)
                        )
                    
                    let linkMessage = await resourceEditInteraction.reply({
                        content: `What should the ${name} be?`,
                        components: [row],
                        fetchReply: true
                    })

                    let collector = linkMessage.createMessageComponentCollector()

                    collector.on('collect', async editResourceLinksInteraction => {
                        let values = editResourceLinksInteraction.values
                        
                        let index = values.indexOf("addNew")
                        if(index >= 0) {
                            values.splice(index, 1);

                            let modal = new ModalBuilder()
                                .setCustomId("addNewTagModal")
                                .setTitle(`Add new tag`)
                                .addComponents(
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new TextInputBuilder()
                                                .setCustomId("addNewTagModalInput")
                                                .setLabel("Whats the new tag?")
                                                .setStyle(TextInputStyle.Short)
                                                .setRequired(true)
                                        )
                                )

                            await editResourceLinksInteraction.showModal(modal)

                            editResourceLinksInteraction.awaitModalSubmit({ time: 60_000 })
                            .then(async modalInteraction => {
                                let value = modalInteraction.fields.getTextInputValue('addNewTagModalInput');

                                let newTag = await database.get(DatabaseTables.Tags).create({
                                    guildID: _Resource.guildID,
                                    name: value
                                })

                                values.push(newTag.id);

                                _Resource = addTags(values, modalInteraction, tableField, LinkTable, _Resource, _MainMessage)
                            }).catch(err => {
                                console.log('No modal submit interaction was collected')
                                console.log(err)
                            })
                        } else {
                            _Resource = addTags(values, editResourceLinksInteraction, tableField, LinkTable, _Resource, _MainMessage)
                        }

                        resourceEditInteraction.deleteReply()
                    })
                    break;
                case "editResourceLinks":
                    await linkResource(_Resource, resourceEditInteraction)
                    break;
            }
        } else {
            let name;
            let tableField;
            let inputLength;
            let modalText;

            switch(resourceEditInteraction.customId) {
                case "changeResourceName":
                    name = "name";
                    tableField = "name"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the new name?"
                    break;
                case "changeResourceDescription":
                    name = "description";
                    tableField = "description"
                    inputLength = TextInputStyle.Paragraph
                    modalText = "What's the new description?"
                    break;
                case "setResourceURL":
                    name = "url";
                    tableField = "url"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the link url?"
                    break;
                case "setResourceImage":
                    name = "image";
                    tableField = "image"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the image url?"
                    break;
                case "setResourceThumbnail":
                    name = "thumbnail";
                    tableField = "thumbnail"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the thumbnail url?"
                    break;
                case "setResourcePhone":
                    name = "phone number";
                    tableField = "phoneNumber"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the phone number?"
                    break;
                case "setResourceEmail":
                    name = "email";
                    tableField = "email"
                    inputLength = TextInputStyle.Short
                    modalText = "What's the email address?"
                    break;
                case "setResourceAddress":
                    name = "address";
                    tableField = "address"
                    inputLength = TextInputStyle.Paragraph
                    modalText = "What's the address?"
                    break;
                case "setResourceHours":
                    name = "open hours";
                    tableField = "openHours"
                    inputLength = TextInputStyle.Paragraph
                    modalText = `When is ${_Resource.name} open?`
                    break;
                case "setResourceEligibility":
                    name = "eligibility";
                    tableField = "eligibility"
                    inputLength = TextInputStyle.Paragraph
                    modalText = `What are the eligibility requirements?`
                    break;
            }

            let modal = new ModalBuilder()
                .setCustomId("updateResourceModal")
                .setTitle(`Change resource ${name}`)
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId("updateResourceModalInput")
                                .setLabel(modalText)
                                .setStyle(inputLength)
                                .setRequired(true)
                        )
                )

            await resourceEditInteraction.showModal(modal)

            resourceEditInteraction.awaitModalSubmit({ time: 60_000 })
            .then(async modalInteraction => {
                let value = modalInteraction.fields.getTextInputValue('updateResourceModalInput');

                if(value == "") {
                    modalInteraction.reply({
                        content: `You cannot set a resource's ${name} to nothing.`
                    })
                    return null;
                }

                if(name == "url") {
                    let urlTest = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

                    if(!urlTest.test(value)) {
                        value = "https://" + value
                        if(!urlTest.test(value)) {
                            modalInteraction.reply({
                                content: `You cannot set a resource's url to this. It must be a real url, that starts with 'https://'`
                            })
                            return null;
                        }
                    }
                }

                let updateData= {};
                updateData[tableField] = value;

                console.log(_Resource)
                let rowcount = await modalInteraction.client.database.get(DatabaseTables.Resources).update(updateData, { where: {id: _Resource.id} })
                _Resource = await modalInteraction.client.database.get(DatabaseTables.Resources).findOne({ where: {id: _Resource.id} });
                
                if(rowcount == 1) {
                    await resourceEditInteraction.editReply({
                        embeds: [await getLongEmbed(_Resource, interaction.client.database)],
                        components: await getComponents(_Resource, database)
                    })
                    
                    let modalMessage = await modalInteraction.reply({
                        content: "Updated!"
                    })
                    
                    setTimeout(() => {
                        modalInteraction.deleteReply();
                    }, 2500)
                } else {
                    let modalMessage = await modalInteraction.reply({
                        content: "Something went wrong. Please try again."
                    });
        
                    setTimeout(() => {
                        modalInteraction.deleteReply()
                    }, 2500)
                }
            })
            .catch(err => {
                console.log('No modal submit interaction was collected')
                console.log(err)
            })
        }
    })
}

let _PageHandler
async function linkResource(resource, resourceEditInteraction) {
    let database = resourceEditInteraction.client.database

    let resources = await database.get(DatabaseTables.Resources).findAll({
        where: {guildID: resource.guildID, finished: true}
    })

    let resourceTypes = await database.get(DatabaseTables.ResourceTypes).findAll({
        where: {guildID: resource.guildID}
    })

    let buttonRowsObj = getResourceTypeButtons(resources, resourceTypes);
    let buttonRows = buttonRowsObj.rows;

    let linkTypeMessage = await resourceEditInteraction.reply({
        content: `Instructions:`
        +   `\n\t`
        +   `Using this wizard you will be able to add a link to another resource.` 
        +   ` ${resource.name} will display a link to that resorce, and that resource will have a link to ${resource.name}.`
        +   ` A example of how to use this is to have a link to an Organization, Provider, or Store on ${resource.name} like its a product or service.`
        +   ` You can create the link on ${resource.name} and the Organization/Provider/Store will populate a list of links to the products and services youre adding as you go!` 
        +   ` A resource can have links, and be linked to at the same time.`
        +   `\n\n\n`
        +   ` What kind of resource do you want ${resource.name} to have a link to?`,
        components: buttonRows,
        fetchReply: true
    })

    let linkTypeCollector = linkTypeMessage.createMessageComponentCollector()

    linkTypeCollector.on("collect", async linkTypeInteraction => {
        linkTypeMessage.delete()

        let resourceTypeName = linkTypeInteraction.customId;
        let sortedResoruces = buttonRowsObj.sortedResources[resourceTypeName].finished;

        looseEnd(linkTypeInteraction);

        _PageHandler = await getPageHandler(sortedResoruces, linkTypeInteraction.channel, database, ComponentHandlerType.Select, {type: false, tags: true}, SetLink)
    })
}

async function SetLink(value) {
    console.log("Setting Link")
    let linkedResource = value.resource;
    let interaction = value.interaction;

    let database = interaction.client.database;

    console.log("Adding to database")
    let entry = await database.get(DatabaseTables.ResourceLinks).create({
        guildID: _Resource.guildID,
        resourceID: _Resource.id,
        linkedID: linkedResource.id
    })

    if(entry) {
        _PageHandler.removeAllMessages();
        let updateMsg = await interaction.reply({content: "Linked! This wont show here, but it will when you're finding resources.", fetchReply: true})

        setTimeout(() => {

            updateMsg.delete()
        }, 5000)
    } else {
        interaction.reply("Something went wrong. Please try again.")

        setTimeout(() => {
            interaction.deleteReply()
        }, 2000)
    }
}

async function addTags(values, editResourceLinksInteraction, tableField, LinkTable, resource, message) {
    let entries = [];
    for(let i = 0; i < values.length; i++) {
        entries.push({
            guildID: resource.guildID,
            resourceID: resource.id
        })

        entries[i][tableField] = values[i]
    }

    let rowCount = await editResourceLinksInteraction.client.database.get(LinkTable).bulkCreate(entries);

    if(rowCount.length > 0) {
        let updateMessage = await editResourceLinksInteraction.reply({
            content: "Updated!"
        })

        message.edit({
            embeds: [await getLongEmbed(resource, editResourceLinksInteraction.client.database)],
            components: await getComponents(resource, editResourceLinksInteraction.client.database)
        })

        setTimeout(() => {
            editResourceLinksInteraction.deleteReply();
        }, 2500)
    }

    return resource;
}

async function getComponents(resource, database) {
    //name description tags roles resources

    let LinkButton = new ButtonBuilder()
        .setCustomId("editResourceLinks")
        .setLabel("Link to resource")
        .setStyle(ButtonStyle.Primary)

    let row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("changeResourceName")
                .setLabel("Change name")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("changeResourceDescription")
                .setLabel("Change description")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("editResourceTags")
                .setLabel("Edit tags")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("editResourceRoles")
                .setLabel("Edit roles")
                .setStyle(ButtonStyle.Primary),

        )

    if(await database.get(DatabaseTables.Resources).count({
        where: {guildID: resource.guildID, finished: true}
    }) > 0) {
        row1.addComponents(LinkButton)
    }

    //url image thumbnail phone email

    let urlButton = new ButtonBuilder()
        .setCustomId("setResourceURL")
        .setStyle(ButtonStyle.Secondary)

    resource.url ? urlButton.setLabel("Change URL") : urlButton.setLabel("Set URL")

    let imageButton = new ButtonBuilder()
        .setCustomId("setResourceImage")
        .setStyle(ButtonStyle.Secondary)

    resource.image ? imageButton.setLabel("Change image") : imageButton.setLabel("Set image")

    let thumbnailButton = new ButtonBuilder()
        .setCustomId("setResourceThumbnail")
        .setStyle(ButtonStyle.Secondary)

    resource.thumbnail ? thumbnailButton.setLabel("Change thumbnail") : thumbnailButton.setLabel("Set thumbnail")

    let phoneButton = new ButtonBuilder()
        .setCustomId("setResourcePhone")
        .setStyle(ButtonStyle.Secondary)

    resource.phoneNumber ? phoneButton.setLabel("Change phone number") : phoneButton.setLabel("Set phone number")

    let emailButton = new ButtonBuilder()
        .setCustomId("setResourceEmail")
        .setStyle(ButtonStyle.Secondary)

    resource.email ? emailButton.setLabel("Change email") : emailButton.setLabel("Set email")

    let row2 = new ActionRowBuilder()
        .addComponents(
            urlButton,
            imageButton,
            thumbnailButton,
            phoneButton,
            emailButton
        )

    //address hours eligibility

    let addressButton = new ButtonBuilder()
        .setCustomId("setResourceAddress")
        .setStyle(ButtonStyle.Secondary)

    resource.address ? addressButton.setLabel("Change address") : addressButton.setLabel("Set address")

    let hoursButton = new ButtonBuilder()
        .setCustomId("setResourceHours")
        .setStyle(ButtonStyle.Secondary)

    resource.openHours ? hoursButton.setLabel("Change open hours") : hoursButton.setLabel("Set open hours")

    let eligibilityButton = new ButtonBuilder()
        .setCustomId("setResourceEligibility")
        .setStyle(ButtonStyle.Secondary)

    resource.eligibility ? eligibilityButton.setLabel("Change eligibility") : eligibilityButton.setLabel("Set eligibility")

    let row3 = new ActionRowBuilder()
        .addComponents(
            addressButton,
            hoursButton,
            eligibilityButton
        )


    let submitButton = new ButtonBuilder()
        .setCustomId("submitResource")
        .setLabel("Submit")

    resource.url || (resource.phoneNumber || resource.address || resource.email) ? 
        submitButton.setStyle(ButtonStyle.Success) : submitButton.setStyle(ButtonStyle.Secondary).setDisabled(true)

    let deleteButton = new ButtonBuilder()
        .setCustomId("deleteResource")
        .setStyle(ButtonStyle.Danger)

    resource.finished ? deleteButton.setLabel("Delete Resource") : deleteButton.setLabel("Cancel")

    let row4 = new ActionRowBuilder()
        .addComponents(
            submitButton,
            deleteButton
        )

    if(resource.finished) {
        row4.addComponents(
            new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary)
        )
    }

    let rows = [
        row1,
        row2,
        row3,
        row4
    ];

    return rows
}
