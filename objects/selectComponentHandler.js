const { ActionRowBuilder } = require("@discordjs/builders");
const { ButtonBuilder, ButtonStyle } = require("discord.js");
const { looseEnd } = require("../shared/looseEnd");
const { getBaseComponetHandler } = require("./baseComponentHandler");

let MessageHandler;
let Resource;
let Collector;
let Message;
let BASE;

let toggleAction;
let toggleActionID;

module.exports = {
    getSelectComponentHandler(messageHandler, resource, database) {
        BASE = getBaseComponetHandler(messageHandler, resource, database);
        MessageHandler = messageHandler
        Resource = resource

        return {
            createListener: createListener,
            getComponets: getComponets
        }
    }
}

function createListener(message) {
    Message = message;

    Collector = BASE.createListener(Message);
    Collect()
}

function getComponets() {
    let selectButton = new ButtonBuilder()
        .setCustomId("selectResource")
        .setLabel("Select")
        .setStyle(ButtonStyle.Success)

    let toggleButtonObj = BASE.getToggleButton()
    toggleAction = toggleButtonObj.action
    toggleActionID = toggleButtonObj.customId

    let row = new ActionRowBuilder()
        .addComponents(
            toggleButtonObj.button,
            selectButton
        )

    return [row]
}

function Collect() {
    Collector.on("collect", async collectInteraction => {
        if(collectInteraction.customId == toggleActionID) {
            await toggleAction()
            looseEnd(collectInteraction)
        } else {
            switch (collectInteraction.customId) {
                case "selectResource":
                    MessageHandler.Callback({Resource, collectInteraction})
                    break;
                default:
                    looseEnd(collectInteraction)
            }
        }
    })
}