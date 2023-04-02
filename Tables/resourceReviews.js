const Sequelize = require("sequelize")

const name = 'resourceReviews'
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
            userID: Sequelize.STRING,
            review: Sequelize.TEXT
        })
    },
    classify(database){
        Reflect.defineProperty(database[name].prototype, 'add', {
            value: async entry => {
                return database[name].create({
                    guildID: entry.guildID,
                    resourceID: entry.resourceID,
                    userID: entry.userID,
                    review: entry.review
                })
            }
        })

        Reflect.defineProperty(database[name].prototype, 'removeByResource', {
            value: entry => {
                const rowCount = database[name].destroy({
                    where: {guildID: entry.guildID, resourceID: entry.resourceID}
                })

                if(rowCount) return rowCount + ' reviews removed.'

                return 'No reviews removed.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'removeByID', {
            value: entry => {
                const rowCount = database[name].destroy({
                    where: {ID: entry.ID}
                })

                if(rowCount) return rowCount + ' review removed.'

                return 'No reviews removed.'
            }
        })

        Reflect.defineProperty(database[name].prototype, 'edit', {
            value: async entry => {
                const review = await database[name].findOne({
                    where: {ID: entry.ID}
                })

                if(review.length == 0) return '[WARNING] No entry found.'

                if(!entry.review) return '[WARNING] Cannot set a review to an empty string.'

                review.review = entry.review
                return review.save();
            }
        })
    }
}