const { ButtonBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");
const { getLongEmbed } = require("../shared/getLongEmbed");
const { getShortEmbed } = require("../shared/getShortEmbed")

let _MessageHandler;
let _Resource;
let _Database;

let _shortEmbed = true;
let _showingLinked = false;

module.exports = {
    getBaseComponetHandler(messageHandler, resource, database) {
        _MessageHandler = messageHandler;
        _Resource = resource;
        _Database = database;

        return {
            getToggleButton: getToggleButton,
            createListener: createListener,
            toggleEmbed: toggleEmbed,
            setViewingLinked: setViewingLinked
        }
    }
}

function getToggleButton() {
    let button = new ButtonBuilder()
        .setCustomId("toggleEmbedSize")
        .setStyle(ButtonStyle.Primary)

    return {
        button: _showingLinked 
            ? button.setLabel(`Return to ${_Resource.name}`) 
                : _shortEmbed ? button.setLabel(`View ${_Resource.name} details`) 
                    : button.setLabel(`Hide ${_Resource.name} details`),
        action: toggleEmbed,
        customId: "toggleEmbedSize"
    }
}

async function toggleEmbed() {
    if(_showingLinked) {
        _MessageHandler.setEmbed(await getShortEmbed(_Resource, _Database))
        _shortEmbed = true;
        _showingLinked = false;
    } else {
        if(_shortEmbed) {
            _MessageHandler.setEmbed(await getLongEmbed(_Resource, _Database))
        }else {
            _MessageHandler.setEmbed(await getShortEmbed(_Resource, _Database))
        }

        _shortEmbed = !_shortEmbed
    }
}

function createListener(message) {
    return message.createMessageComponentCollector();
}

function setViewingLinked() {
    _showingLinked = true
}