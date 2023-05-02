const fs = require('fs');
const path = require('path');

exports.deleteFile = (filePath) => {
    // console.log(filePath)
    filePath = path.normalize(filePath); //convert to platform specific path(\ in WINDOWS, / in POSIX)   
    // console.log(filePath)
    filePath = path.join(__dirname, '..', filePath);
    return fs.unlink(filePath, (err) => {
        if (err) {
            return err;
        }
    });
}