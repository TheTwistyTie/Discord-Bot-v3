const Sequelize = require("sequelize")

const name = 'resourceLinks'
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
            resourceID: Sequelize.INTEGER,
            linkedID: Sequelize.INTEGER
        })
    }, 
    link(database) {
        database[name].belongsTo(database["resources"], { foreignKey: 'linkedID', as: 'linked'});
    },
    classify(database) {
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: entry => {
                return database[name].create({
                    guildID: entry.guildID,
                    resourceID: entry.resourceID,
                    linkedID: event.linkedID
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'remove', {
            value: entry => {
                return database[name].destory({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID, linkedID: entry.linkedID}
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'removeAll', {
            value: entry => {
                let rowCount = 0;

                rowCount += database[name].destory({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID}
                })

                rowCount += database[name].destory({
                    where: {guildID: entry.guildID, linkedID: entry.resourceID}
                })

                if(rowCount == 0) return 'No links removed.'
                
                return rowCount + ' links removed.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'get', {
            value: entry => {
                return database[name].findAll({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID},
                    include: ['linked']
                })
            }
        })
    }
}