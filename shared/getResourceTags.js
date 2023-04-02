const { DatabaseTables } = require("../enums")
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = {
    async getResourceTags(resource, database){
        let tagLinks = await database.get(DatabaseTables.ResourceTags).findAll({
            where: {guildID: resource.guildID, resourceID: resource.id}
        })

        if(tagLinks.length == 0) {
            return ""
        }

        let tags = await database.get(DatabaseTables.Tags).findAll({
            where: {guildID: resource.guildID, id: {
                [Op.in]: tagLinks.map(taglink => taglink.tagID) 
            }}
        })

        if(tags.length == 0) {
            console.log("[ERROR] A resource has a tag that does not exist.")

            let rowcount = await database.get(DatabaseTables.ResourceTags).destroy({
                where: {guildID: resource.guildID, tagID: {
                    [Op.in]: tagLinks.map(taglink => taglink.tagID)
                }}
            })

            console.log(`Removed ${rowcount} tagLinks that had the missing tag(s)`)

            return ""
        }

        let ouput = tags[0].name
        for(let i = 1; i < tags.length; i++) {
            ouput += ", " + tags[i].name
        }

        return ouput;
    }
}