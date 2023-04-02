const { DatabaseTables } = require("../enums");

module.exports = {
    async getEmbedColor (resource, database) {
        const red = [255, 0, 0] //'#FF0000'
        const yellow = [255, 255, 0] //'#FFFF00'
        const green = [0, 255, 0] //'#00FF00'
        const grey = [128, 128, 128] //'#808080'

        let ratings = await database.get(DatabaseTables.ResourceRatings).findAll({
            where: {guildID: resource.guildID, resourceID: resource.id}
        })
    
        if(ratings.length == 0) {
            return grey
        }
    
        let numRatings = ratings.length;
        let rating = 0
    
        for(let i = 0; i < numRatings; i++) {
            rating += ratings[i].rating;
        }
    
        rating = rating/numRatings
    
        let ratingPercent = (rating / 5.0) - 0.1
    
        let ratingColor
        if(ratingPercent < 0.5) {
            ratingColor = blendColors(red, yellow, ratingPercent * 2)
        } else {
            ratingColor = blendColors(yellow, green, (ratingPercent - 0.5) * 2)
        }
    
        if(numRatings < 5) {
            let geryblend = (numRatings / 5.0) - 0.1
    
            ratingColor = blendColors(grey, ratingColor, geryblend)
        }
    
        return ratingColor
    }
}

function blendColors (color1, color2, percentage) {
    let color1RGB = [parseInt(color1[1] + color1[2], 16), parseInt(color1[3] + color1[4], 16), parseInt(color1[5] + color1[6], 16)];
    let color2RGB = [parseInt(color2[1] + color2[2], 16), parseInt(color2[3] + color2[4], 16), parseInt(color2[5] + color2[6], 16)];

    let color3RGB = [ 
        (1 - percentage) * color1RGB[0] + percentage * color2RGB[0], 
        (1 - percentage) * color1RGB[1] + percentage * color2RGB[1], 
        (1 - percentage) * color1RGB[2] + percentage * color2RGB[2]
    ];

    let color3 = '#' + intToHex(color3RGB[0]) + intToHex(color3RGB[1]) + intToHex(color3RGB[2]);

    return color3
}

function intToHex (num) {
    let hex = Math.round(num).toString(16);
    if (hex.length == 1)
        hex = '0' + hex;
    return hex;
}