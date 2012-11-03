var db
  , gsFile = require('mongoskin').GridStore
  , ObjectId = require('mongoskin').ObjectID
  , tempFS = require('temp')
  , path = require('path')
  , fs = require('fs');

exports.setDb = setDb;
exports.getImage = getImage;
exports.saveImage = saveImage;
exports.deleteImage = deleteImage;
exports.createGif = createGif;

function setDb(database) {
    db = database.db;
}

function getImage(imageID, callback){
    var id = new ObjectId(imageID);
    var theImage = new gsFile(db, id, 'r');
    theImage.open(function(err, file) {
        if (err) {
            return callback.call(err, err);
        }
        file.read(function(err, data) {
            if (err) {
                return callback.call(err, err);
            }
            return callback.apply(data, [null, data]);
        });
    });
}

function saveImage(user, image, callback){
    var id = new ObjectId();
    var theImage = new gsFile(db, id, 'w');
    theImage.open(function(err, file) {
        if (err) { 
            return callback.call(err, err); 
        }
        file.writeFile(image, function(err, res) {
            if (err) {
                return callback.call(err, err);
            }
            user.api.addImageToUserSequence(id.toString(), user.id, function(err,res) {
                if (err) { 
                    exports.deleteImage(id, function(newErr, res) {
                        if (err) { return callback.call(newErr, newErr); }
                        return callback.call(err, err); 
                    });
                }
                return callback.apply(res, [null, id]); 
            });
        });
    });
}

function deleteImage(imageID, callback){
    var id = newObjectId(imageID);
    var theImage = new gsFile(db, id, 'w');
    theImage.unlink(function (err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(imageID, null, imageID);
    });
}

function createGif(params, callback) {
    var userAPI = params.api;
    var sequence = params.sequence;
    if (!sequence.length || sequence.length < 2) {
        var errMsg = 'Not enough images for an animation';
        callback.call(errMsg, errMsg);
    }
    tempFS.mkdir('tmp', function(err, dirPath) {
        console.log('temp directory created at: ' + dirPath);
        if (err) { return callback.call(err, err); }
        var numImgsSaved = 0;
        for (var i=0; i < sequence.length; ++i) {
            (function(numCalled) {
                exports.getImage(sequence[numCalled], function(err, img) {
                    if (err) {
                        errMsg = 'Problem saving temp file';
                        numImgsSaved = -50;
                        return callback.call(errMsg, errMsg);
                    }
                    var filePath = path.join(dirPath, 'img' + numCalled + '.jpg');
                    console.log('filepath: ' + filePath);
                    fs.writeFile(filePath, img, function(err) {
                        if (err) {
                            console.log('problem creating file ' + filePath);
                            numImgsSaved = -50;
                            return callback.call(errMsg, errMsg);
                        }
                        console.log(filePath + ' created!');
                        if (++numImgsSaved === sequence.length) {
                             return makeGif(dirPath,callback);
                        }
                    });
                });
            })(i);
        }
    });
}

function makeGif(tempDir, callback) {
    console.log('should probably make some gifs now!');
}

