const Sequelize = require("sequelize")

const name = 'roleTypes'
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
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            color: {
                type: Sequelize.INTEGER
            },
            allowMultiple: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false
            }
        })
    } 
}