const { ActionRowBuilder } = require("@discordjs/builders");
const { ButtonBuilder, ButtonStyle } = require("discord.js");
const { looseEnd } = require("../shared/looseEnd");
const { getBaseComponetHandler } = require("./baseComponentHandler");

let _MessageHandler;
let _Resource;
let _Collector;
let _Message;
let _BASE;

let _toggleAction;
let _toggleActionID;

module.exports = {
    getSelectComponentHandler(messageHandler, resource, database) {
        _BASE = getBaseComponetHandler(messageHandler, resource, database);
        _MessageHandler = messageHandler
        _Resource = resource

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

function getComponets() {
    let selectButton = new ButtonBuilder()
        .setCustomId("selectResource")
        .setLabel("Select")
        .setStyle(ButtonStyle.Success)

    let toggleButtonObj = _BASE.getToggleButton()
    _toggleAction = toggleButtonObj.action
    _toggleActionID = toggleButtonObj.customId

    let row = new ActionRowBuilder()
        .addComponents(
            toggleButtonObj.button,
            selectButton
        )

    return [row]
}

function Collect() {
    _Collector.on("collect", async collectInteraction => {
        if(collectInteraction.customId == _toggleActionID) {
            await _toggleAction()
            looseEnd(collectInteraction)
        } else {
            switch (collectInteraction.customId) {
                case "selectResource":
                    _MessageHandler.CallBack({
                        resource: _Resource,
                        interaction: collectInteraction
                    })
                    break;
                default:
                    looseEnd(collectInteraction)
            }
        }
    })
}