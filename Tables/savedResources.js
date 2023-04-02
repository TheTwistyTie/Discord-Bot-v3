const Sequelize = require("sequelize")

const name = 'savedResources';
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
            userID: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            resourceID: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        })
    } 
}