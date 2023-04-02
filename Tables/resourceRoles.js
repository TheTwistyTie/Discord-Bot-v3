const Sequelize = require("sequelize");
const { DatabaseTables } = require("../enums");

const name = "resourceRoles"
module.exports = {
    data: {
        name: name
    },
    initialize(sequelize) {
        return sequelize.define(name, {
            guildID: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            resourceID: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            roleID: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
        })
    }
}