const Sequelize = require("sequelize")

const name = 'settings';
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
            initialized: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            
        })
    } 
}