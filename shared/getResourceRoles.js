const { DatabaseTables } = require("../enums")
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

module.exports = {
    async getResourceRoles(resource, database){
        let roleLinks = await database.get(DatabaseTables.ResourceRoles).findAll({
            where: {guildID: resource.guildID, resourceID: resource.id}
        })

        if(roleLinks.length == 0) {
            return ""
        }

        let roles = await database.get(DatabaseTables.Roles).findAll({
            where: {guildID: resource.guildID, id: {
                [Op.in]: roleLinks.map(roleLink => roleLink.roleID) 
            }}
        })

        if(roles.length == 0) {
            console.log("[ERROR] A resource has a role that does not exist.")

            let rowcount = await database.get(DatabaseTables.ResourceRoles).destroy({
                where: {guildID: resource.guildID, tagID: {
                    [Op.in]: roleLinks.map(roleLink => roleLink.tagID)
                }}
            })

            console.log(`Removed ${rowcount} roleLinks that had the missing tag(s)`)

            return ""
        }

        let ouput = "@" + roles[0].name
        for(let i = 1; i < roles.length; i++) {
            ouput += ", @" + roles[i].name
        }

        return ouput;
    }
}