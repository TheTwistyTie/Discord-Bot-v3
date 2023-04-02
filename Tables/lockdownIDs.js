const Sequelize = require("sequelize")

const name = 'lockdownIDs';
module.exports = {
    data: {
        name: name
    },
    initialize(sequelize){
        return sequelize.define(name, {
            guildID: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            channelID: {
                type: Sequelize.STRING,
                allowNull: false
            }
        })
    }
}