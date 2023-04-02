const Sequelize = require("sequelize")

const name = 'resourceTags'
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
            resourceID: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            tagID: {
                type: Sequelize.INTEGER,
                allowNull: false
            }
        });
    },
    link(database){
        database[name].belongsTo(database["tags"], { foreignKey: 'tagID', as: 'tag'});
    },
    classify(database){
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: entry => {
                return database[name].create({guildID: entry.guildID, resourceID: entry.resourceID, tagID: entry.tagID})
            }
        })

        Reflect.defineProperty(database[name].prototype, 'remove', {
            value: entry => {
                const rowCount = database[name].destroy({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID, tagID: entry.tagID}
                })

                if(rowCount) return rowCount + ' items removed.'

                return 'No items removed.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'removeAll', {
            value: entry => {
                let rowCount = 0;

                if(entry.resourceID) {
                    rowCount += database[name].destroy({
                        where: {guildID: entry.guildID, resourceID: entry.resourceID}
                    })
                }

                if(entry.tagID) {
                    rowCount += database[name].destroy({
                        where: {guildID: entry.guildID, tagID: entry.tagID}
                    })
                }

                if(rowCount == 0) return 'An error has occured while trying to remove items.'

                return rowCount + ' items removed.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'get', {
            value: entry => {
                return database[name].findAll({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID},
                    include: ['tag']
                })
            }
        })
    }
}