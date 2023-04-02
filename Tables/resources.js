const Sequelize = require("sequelize")

const name = 'resources';
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
            resourceTypeID: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            url: Sequelize.STRING,
            thumbnail: Sequelize.STRING,
            image: Sequelize.STRING,
            openHours: Sequelize.STRING,
            phoneNumber: Sequelize.STRING,
            address: Sequelize.STRING,
            email: Sequelize.STRING,
            eligibility: Sequelize.STRING,
            finished: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        })
    }, 
    link(database) {
        database[name].belongsTo(database["resourceTypes"], { foreignKey: 'resourceTypeID', as: 'resourceType'});
    },
    classify(database) {
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: async entry => {
                return database[name].create({ 
                    guildID: entry.guildID,
                    resourceTypeID: entry.resourceTypeID,
                    name: entry.name,
                    description: entry.description,
                    url: entry.url,
                    thumbnail: entry.thumbnail,
                    image: entry.image,
                    openHours: entry.openHours,
                    phoneNumber: entry.phoneNumber,
                    address: entry.address,
                    email: entry.email,
                    eligibility: entry.eligibility
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'edit', {
            value: async entry => {
                const rowCount = await database[name].update(
                    { 
                        guildID: entry.guildID,
                        resourceTypeID: entry.resourceTypeID,
                        name: entry.name,
                        description: entry.description,
                        url: entry.url,
                        thumbnail: entry.thumbnail,
                        image: entry.image,
                        openHours: entry.openHours,
                        phoneNumber: entry.phoneNumber,
                        address: entry.address,
                        email: entry.email,
                        eligibility: entry.eligibility
                    },
                    {
                        where: {ID: entry.ID, guildID: entry.guildID}
                    }
                )

                if(!rowCount) return 'An error has occured.'

                return rowCount + ' resource edited.'               
            }
        })

        Reflect.defineProperty(database[name].prototype, 'delete', {
            value: entry => {
                const rowCount = database[name].destory({
                    where: {guildID: entry.guildID, ID: entry.ID}
                })

                if(rowCount) return rowCount + ' resource removed.'

                return 'An error has occured.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'get', {
            value: entry => {
                return database[name].findAll({
                    where: {guildID: entry.guildID}
                })
            }
        })
    }
}