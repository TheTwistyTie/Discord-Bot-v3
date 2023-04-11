const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { Op } = require("sequelize");
const { DatabaseTables } = require("../enums");
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
                    break;
                case "viewParent":
                    break;
                case "rateResource":
                    break;
                case "seeResourceReviews":
                    break;
                case "viewChildren":
                    break;
                case "childrenSelect":
                    break;
                case "editResource":
                    break;
            }
        }
    })
}