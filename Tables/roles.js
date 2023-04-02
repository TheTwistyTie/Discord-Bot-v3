const Sequelize = require("sequelize")

const name = 'roles';
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
            roleID: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            roleTypeID: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            canEditResources: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            isMod: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        })
    },
    link(database) {
        database[name].belongsTo(database['roleTypes'], { foreignKey: 'roleTypeID', as: 'roleType'});
    },
    classify(database) {
        Reflect.defineProperty(database[name].prototype, 'get', {
            value: entry => {
                return database[name].findAll({
                    where: {guildID: entry.guildID, name: entry.name},
                    include: ['roleType']
                })
            }
        })
    }
}