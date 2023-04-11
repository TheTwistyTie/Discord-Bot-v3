const { ComponentHandlerType } = require("../enums");
const { getResourceTags } = require("../shared/getResourceTags");
const { getShortEmbed } = require("../shared/getShortEmbed");
const { getSelectComponentHandler } = require("./selectComponentHandler");
const { getViewResourceComponentHandler } = require("./viewResourceComponetHandler");

let _Resource;
let _ComponetHandler;
let _Database;
let _CallBack;

let Message;

let Embed;

module.exports = {
    async getMessageObject(resource, componentHandlerType, database, callback) {
        _Resource = resource;
        _Database = database;
        _CallBack = callback;

        Embed = await getShortEmbed(_Resource, _Database);

        let componentHandler;
        switch (componentHandlerType) {
            case ComponentHandlerType.Select:
                componentHandler = getSelectComponentHandler(returnObj(), _Resource, _Database)
                break;
            case ComponentHandlerType.ViewResources:
                componentHandler = getViewResourceComponentHandler(returnObj(), _Resource, _Database)
                break;
            case ComponentHandlerType.Default:
                componentHandler = null //toDo
                break;
        }

        _ComponetHandler = componentHandler;

        return returnObj()
    }
}

function returnObj(){
    return {
        addMessage: addMessage,
        removeMessage: removeMessage,
        setEmbed: setEmbed,
        CallBack: _CallBack,
        getTags: getTags,
        name: _Resource.name
    }
}

async function getTags() {
    return await getResourceTags(_Resource, _Database);
}

async function addMessage(channel) {
    Message = await channel.send({
        content: `${_Resource.name}:`,
        components: await _ComponetHandler.getComponets(),
        embeds: [Embed]
    })

    _ComponetHandler.createListener(Message);
}

function removeMessage() {
    if(Message) {
        Message.delete();
    }
}

async function refreshMessage() {
    if(Message) {
        Message = await Message.edit({
            components: await _ComponetHandler.getComponets(),
            embeds: [Embed]
        })
    }
}

function setEmbed(embed) {
    Embed = embed;
    refreshMessage()
}