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

            sortedResources[resourceTypes[i].name] = resources.filter((resource) => {
                return resource.resourceTypeID == resourceTypes[i].id
            })

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