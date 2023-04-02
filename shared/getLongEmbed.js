const { EmbedBuilder } = require("@discordjs/builders")
const { DatabaseTables } = require("../enums")
const { getEmbedColor } = require("./getEmbedColor")
const { getResourceRoles } = require("./getResourceRoles")
const { getResourceTags } = require("./getResourceTags")

module.exports = {
    async getLongEmbed(resource, database) {
        
        const embed = new EmbedBuilder()
            .setTitle(resource.name)
            .setDescription(resource.description)
            .setColor(await getEmbedColor(resource, database))
    
            if(resource.image){
                console.log(resource.image)

                embed.setImage(resource.image)
            }
        
            if(resource.thumbnail){
                embed.setThumbnail(resource.thumbnail)
            }
        
            if(resource.url) {
                embed.setURL(resource.url)
            }
    
            let fields = []
            if(resource.openHours) {
                fields.push({
                    name: "Open hours:",
                    value: resource.openHours,
                    inline: true
                })
            }
    
            if(resource.phoneNumber) {
                fields.push({
                    name: "Phone number:",
                    value: resource.phoneNumber,
                    inline: true
                })
            }

            if(resource.email) {
                fields.push({
                    name: "Email:",
                    value: resource.email,
                    inline: true
                })
            }
    
            if(resource.address) {
                fields.push({
                    name: "Address:",
                    value: resource.address,
                    inline: false
                })
            }
    
            if(resource.eligibility) {
                fields.push({
                    name: "Eligibility:",
                    value: resource.eligibility,
                    inline: false
                })
            }
            
            let tags = await getResourceTags(resource, database);
            if(tags != "") {
                fields.push({
                    name: "Tags:",
                    value: tags,
                    inline: true
                })
            }
    
            let roles = await getResourceRoles(resource, database);
            if(roles != "") {
                fields.push({
                    name: "Roles:",
                    value: roles,
                    inline: true
                })
            }
    
            embed.addFields(fields)
        
            return embed
    }
}
