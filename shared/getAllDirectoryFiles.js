const fs = require("fs")
const path = require("path")

module.exports = { 
    getAllDirectoryFiles(dirPath) {
        return doWork(dirPath)
    }
}

function doWork(dirPath){
    const files = fs.readdirSync(dirPath);

    let arrayOfFiles = []

    for(let i = 0; i < files.length; i++){
        if(fs.statSync(path.join(dirPath, files[i])).isDirectory()){
            const subFiles = doWork(path.join(dirPath, files[i]));
            for(let c = 0; c < subFiles.length; c++){
                arrayOfFiles.push(subFiles[c])
            }
        } else {
            arrayOfFiles.push(path.join(dirPath, files[i]))
        }
    }

    return arrayOfFiles
}