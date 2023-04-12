const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { Op } = require("sequelize");
const { editResource } = require("../actions/addResource");
const { DatabaseTables } = require("../enums");
const { getLongEmbed } = require("../shared/getLongEmbed");
const { getBaseComponetHandler } = require("./baseComponentHandler");

let _MessageHandler;
let _Resource;
let _Collector;
let _Message;
let _BASE;
let _Database;

let _toggleAction;
let _toggleActionID

let _Parent;
let _ParentType;

let _Children;
let _ChildrenTypes;

let _canEdit = false;

module.exports = {
    getViewResourceComponentHandler(messageHandler, resource, database) {
        _BASE = getBaseComponetHandler(messageHandler, resource, database);
        _MessageHandler = messageHandler;
        _Resource = resource;
        _Database = database;

        return {
            createListener: createListener,
            getComponets: getComponets
        }
    }
}

function createListener(message) {
    _Message = message;

    _Collector = _BASE.createListener(_Message);
    Collect()
}

async function getComponets() {
    let output = []

    let resourceReviews = await _Database.get(DatabaseTables.ResourceReviews).findAll({
        where: {guildID: _Resource.guildID, resourceID: _Resource.id}
    });

    let isSaved = await _Database.get(DatabaseTables.SavedResources).findOne({
        where: {guildID: _Resource.guildID, resourceID: _Resource.id, userID: _MessageHandler.CallBack.interaction.member.id}
    }) ? true : false

    if(!_Parent) {
        let parentLink = await _Database.get(DatabaseTables.ResourceLinks).findOne({
            where: {guildID: _Resource.guildID, resourceID: _Resource.id}
        }) 

        if(parentLink) {
            _Parent = await _Database.get(DatabaseTables.Resources).findOne({
                where: {guildID: _Resource.guildID, id: parentLink.linkedID}
            })
    
            _ParentType = await _Database.get(DatabaseTables.ResourceTypes).findOne({
                where: {guildID: _Resource.guildID, id: _Parent.resourceTypeID}
            })
        }
    }

    if(!_Children) {
        let childrenLinks = await _Database.get(DatabaseTables.ResourceLinks).findAll({
            where: {guildID: _Resource.guildID, linkedID: _Resource.id}
        })

        if(childrenLinks.length > 0) {
            let childrenIDs = childrenLinks.map(link => link.resourceID);

            _Children = await _Database.get(DatabaseTables.Resources).findAll({
                where: {guildID: _Resource.guildID, id: {
                    [Op.in]: childrenIDs
                }}
            })

            let typeIDs = _Children.map(child => child.resourceTypeID)

            _ChildrenTypes = await _Database.get(DatabaseTables.ResourceTypes).findAll({
                where: {guildID: _Resource.guildID, id: {
                    [Op.in]: typeIDs
                }}
            })
        }
    }

    if(!_canEdit) {
        let userRoles = _MessageHandler.CallBack.interaction.member.roles.cache

        let roles = await _Database.get(DatabaseTables.Roles).findAll({
            where: {guildID: _Resource.guildID, roleID: {
                [Op.in]: userRoles.map(role => role.id)
            }}
        })

        roles.forEach(role => {
            if(role.canRediResources || role.isMod) {
                _canEdit = true;
            }
        })
    }

    let toggleButtonObj = _BASE.getToggleButton()
    _toggleAction = toggleButtonObj.action
    _toggleActionID = toggleButtonObj.customId

    let row = new ActionRowBuilder()
        .addComponents(
            toggleButtonObj.button
        );

    //save, see parent resource, rate, see review
    //see linked page handler, edit

    let saveButton = new ButtonBuilder()
        .setCustomId("saveResource")

    isSaved ? saveButton.setLabel("Unsave").setStyle(ButtonStyle.Secondary) : saveButton.setLabel("Save").setStyle(ButtonStyle.Primary)

    row.addComponents(saveButton)
    
    if(_Parent) {
        let viewParentButton = new ButtonBuilder()
            .setCustomId("viewParent")
            .setLabel(`View linked ${_ParentType.name}`)
            .setStyle(ButtonStyle.Primary);

        row.addComponents(viewParentButton)
    }

    let rateButton = new ButtonBuilder()
        .setCustomId("rateResource")
        .setLabel("Rate")
        .setStyle(ButtonStyle.Primary);

    row.addComponents(rateButton)

    let seeReviewsButton = new ButtonBuilder()
        .setCustomId("seeResourceReviews")
        .setLabel("See Reviews")
        .setStyle(ButtonStyle.Primary)

    if(resourceReviews.length > 0) {
        row.addComponents(seeReviewsButton)
    }

    output.push(row);

    row = new ActionRowBuilder()

    let addLastRow = false
    if(_ChildrenTypes) {
        if(_ChildrenTypes.length == 1) {
            let viewChildrenButton = new ButtonBuilder()
                .setCustomId("viewChildren")
                .setLabel(`View linked ${_ChildrenTypes[0].name}`)
                .setStyle(ButtonStyle.Primary)
    
            row.addComponents(viewChildrenButton)
            addLastRow = true
        } else if(_ChildrenTypes.length > 1) {
            let typeOptions = []
    
            _ChildrenTypes.forEach(type => {
                typeOptions.push({
                    label: type.name,
                    value: type.id
                })
            });
    
            let childTypeSelect = new StringSelectMenuBuilder()
                .setCustomId("childrenSelect")
                .setPlaceholder("View linked resources")
                .addOptions(typeOptions);
            
            row.addComponents(childTypeSelect)
    
            output.push(row)
    
            row = new ActionRowBuilder()
        }
    }

    if(_canEdit) {
        let editButton = new ButtonBuilder()
            .setCustomId("editResource")
            .setLabel("Edit")
            .setStyle(ButtonStyle.Danger)

        row.addComponents(editButton)
        addLastRow = true
    }

    if(addLastRow) {
        output.push(row)
    }

    return output
}

function Collect() {
    _Collector.on("collect", async collectInteraction => {
        if(collectInteraction.customId == _toggleActionID) {
            await _toggleAction()
            looseEnd(collectInteraction)
        } else {
            switch (collectInteraction.customId) {
                case "saveResource":
                    _ToggleSave(collectInteraction)
                    break;
                case "viewParent":
                    _ToggeleParent(collectInteraction)
                    break;
                case "rateResource":
                    _Rate(collectInteraction)
                    break;
                case "seeResourceReviews":
                    _SeeReviews(collectInteraction)
                    break;
                case "viewChildren":
                    _SeeChildren(collectInteraction)
                    break;
                case "childrenSelect":
                    _SeeChildren(collectInteraction)
                    break;
                case "editResource":
                    editResource(_Resource, collectInteraction)
                    break;
            }
        }
    })
}

async function _ToggleSave(interaction) {
    let userID = interaction.user.id

    let entry = await _Database.get(DatabaseTables.SavedResources).findOne({
        where: {
            guildID: _Resource.guildID,
            userID: userID,
            resourceID: _Resource.id
        }
    })

    if(entry) {
        let rowCount = await _Database.get(DatabaseTables.SavedResources).destroy({
            where: {
                guildID: _Resource.guildID,
                userID: userID,
                resourceID: _Resource.id
            }
        })

        if(rowCount > 0) {
            interaction.reply("Unsaved Successfully.")
        } else {
            interaction.reply("An Error has occured.")
        }

        setTimeout(() => {
            interaction.deleteReply()
        }, 2000)

        return
    }

    entry = await _Database.get(DatabaseTables.SavedResources).create({
        guildID: _Resource.guildID,
        userID: userID,
        resourceID: _Resource.id
    })

    if(entry) {
        interaction.reply("Saved Successfully.")
    } else {
        interaction.reply("An Error has occured.")
    }

    setTimeout(() => {
        interaction.deleteReply()
    }, 2000)
}

let _ViewingParent = false;
async function _ToggeleParent(interaction) {
    if(_ViewingParent){
        await _BASE.toggleEmbed()
        return
    }

    let parentLink = await _Database.get(DatabaseTables.ResourceLinks).findOne({
        where: {guildID: _Resource.guildID, resourceID: _Resource.id}
    })

    if(!parentLink) {
        interaction.reply("An error has occured.")

        setTimeout(() => {
            interaction.deleteReply()
        }, 2000)
        return
    }

    let parent = await _Database.get(DatabaseTables._Resource).findOne({
        where: {guildID: _Resource.guildID, id: parentLink.linkedID}
    })

    if(!parent) {
        interaction.reply("An error has occured.")

        setTimeout(() => {
            interaction.deleteReply()
        }, 2000)
        return
    }

    let embed = await getLongEmbed(parent, _Database)

    _MessageHandler.setEmbed(embed)
    _BASE.setViewingLinked()
}

async function _Rate(interaction) {

}

async function _SeeReviews(interaction) {

}

async function _SeeChildren(interaction) {

}