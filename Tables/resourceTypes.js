const Sequelize = require("sequelize")

const name = 'resourceTypes';
module.exports = {
    data: {
        name: name
    },
    initialize(sequelize){
        return sequelize.define(name, {
            guildID: {
                type: Sequelize.STRING,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
            }
        })
    },
    classify(database){
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: async entry => {
                const resourceType = await database[name].findOne({
                    where: {name: entry.type}
                });

                if(resourceType) {
                    return resourceType.save();
                }

                return database[name].create({guildID: entry.guildID, name: entry.type});
            }
        })
    }
}