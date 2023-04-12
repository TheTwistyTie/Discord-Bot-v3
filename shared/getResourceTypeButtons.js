const { ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { ButtonStyle } = require("discord.js");

module.exports = {
    getResourceTypeButtons(resources, resourceTypes, canEdit = false) {
        let sortedResources = {}
        let row = new ActionRowBuilder()
        let rows = []
        
        for(let i = 0; i < resourceTypes.length; i++) {
            if(row.components.length % 5 == 0 && row.components.length != 0) {
                rows.push(row);
                row = new ActionRowBuilder();
            }

            let resourcesOfType = resources.filter((resource) => {
                return resource.resourceTypeID == resourceTypes[i].id
            })

            let finishedResources = resourcesOfType.filter((resource) => {
                return resource.finished == true
            })

            let unfinishedResources = resourcesOfType.filter((resource) => {
                return resource.finished == false
            })

            sortedResources[resourceTypes[i].name] = {
                finished: finishedResources,
                unfinished: unfinishedResources
            }

            let count = sortedResources[resourceTypes[i].name].length
            if(count > 0 || canEdit) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(resourceTypes[i].name)
                        .setLabel(resourceTypes[i].name)
                        .setStyle(ButtonStyle.Primary)
                )
            }
        }

        rows.push(row);
        return {
            rows: rows,
            sortedResources: sortedResources
        };

    }
}