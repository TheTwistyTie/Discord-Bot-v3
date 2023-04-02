const { EmbedBuilder } = require("@discordjs/builders")
const { getEmbedColor } = require("./getEmbedColor")
const { getResourceRoles } = require("./getResourceRoles")
const { getResourceTags } = require("./getResourceTags")

module.exports = {
    async getShortEmbed (resource, database) {
        const embed = new EmbedBuilder()
            .setTitle(resource.name)
            .setDescription(resource.description)
            .setColor(await getEmbedColor(resource, database))

        if(resource.image){
            embed.setImage(resource.image)
        }

        if(resource.thumbnail){
            embed.setThumbnail(resource.thumbnail)
        }
    
        if(resource.url) {
            embed.setURL(resource.url)
        }
        
        embed.setFooter({text: await getResourceRoles(resource, database) + " Tags: " + await getResourceTags(resource, database)})

        return embed
    }
}