const { ButtonBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");
const { getLongEmbed } = require("../shared/getLongEmbed");
const { getShortEmbed } = require("../shared/getShortEmbed")

let MessageHandler;
let Resource;
let Database;

let shortEmbed = true;
let showingLinked = false;

module.exports = {
    getBaseComponetHandler(messageHandler, resource, database) {
        MessageHandler = messageHandler;
        Resource = resource;
        Database = database;

        return {
            getToggleButton: getToggleButton,
            createListener: createListener
        }
    }
}

function getToggleButton() {
    let button = new ButtonBuilder()
        .setCustomId("toggleEmbedSize")
        .setStyle(ButtonStyle.Primary)

    return {
        button: showingLinked 
            ? button.setLabel(`Return to ${Resource.name}`) 
                : shortEmbed ? button.setLabel(`View ${Resource.name} details`) 
                    : button.setLabel(`Hide ${Resource.name} details`),
        action: toggleEmbed,
        customId: "toggleEmbedSize"
    }
}

async function toggleEmbed() {
    if(showingLinked) {
        MessageHandler.setEmbed(await getShortEmbed(Resource, Database))
        shortEmbed = true;
        showingLinked = false;
    } else {
        if(shortEmbed) {
            MessageHandler.setEmbed(await getLongEmbed(Resource, Database))
        }else {
            MessageHandler.setEmbed(await getShortEmbed(Resource, Database))
        }

        shortEmbed = !shortEmbed
    }
}

function createListener(message) {
    return message.createMessageComponentCollector();
}