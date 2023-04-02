const { AutoModerationRuleEventType } = require("discord.js")
const Sequelize = require("sequelize")

const name = 'tags'
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
                unique: true,
            }
        })
    },
    classify(database) {
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: entry => {
                return database[name].create({
                    guildID: entry.guildID,
                    name: entry.name
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'remove', {
            value: entry => {
                const rowCount = database[name].destory({
                    where: {guildID: entry.guildID, name: entry.name}
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'get', {
            value: async entry => {
                return await database[name].findAll({
                    where: {guildID: entry.guildID}
                })
            }
        })
    }
}