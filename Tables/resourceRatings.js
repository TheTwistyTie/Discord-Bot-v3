const Sequelize = require("sequelize")

const name = 'resourceRatings'
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
            userID: {type: Sequelize.STRING, unique: true},
            rating: Sequelize.INTEGER
        })
    },
    classify(database) {
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: async entry => {
                const rating = await database[name].findOne({
                    where: {guildID: entry.guildID, userID: entry.userID, resourceID: entry.resourceID}
                })

                if(rating){
                    rating.rating = entry.rating
                    return rating.save();
                }

                return database[name].create({
                    guildID: entry.guildID,
                    resourceID: entry.resourceID,
                    userID: entry.userID,
                    rating: entry.rating
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'remove', {
            value: entry => {
                const rowCount = database[name].destroy({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID}
                })

                if(rowCount) return rowCount + ' ratings removed.'

                return 'No ratings removed.'
            }
        })
    }
}