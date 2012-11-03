var db
  , gsFile = require('mongoskin').GridStore
  , ObjectId = require('mongoskin').ObjectID
  , tempFS = require('temp')
  , path = require('path')
  , fs = require('fs')
  , im = require('imagemagick');

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
    var saveGif;
    if (user.hasOwnProperty('saveGif')) {
        saveGif = user.saveGif;
    } else {
        saveGif = false;
    }
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
            user.api.addImageToUser({imageId : id.toString(), 
                userId: user.id,
                sequence: user.sequence,
                saveGif: saveGif}, function(err,res) {
                if (err) { 
                    exports.deleteImage(id, function(newErr, res) {
                        if (err) { return callback.call(newErr, newErr); }
                        return callback.call(err, err); 
                    });
                }
                return callback.apply(res, [null, id.toString()]); 
            });
        });
    });
}

function deleteImage(imageID, callback){
    var id = new ObjectId(imageID);
    var theImage = new gsFile(db, id, 'w');
    theImage.unlink(function (err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(imageID, null, imageID);
    });
}

function createGif(params, callback) {
    var sequence = params.sequence;
    if (typeof sequence === 'undefined' || sequence.length < 2) {
        var errMsg = 'Not enough images for an animation';
        callback.call(errMsg, errMsg);
    }
    if (sequence.length > 30) {
        var errMsg = 'Too many images (more than 30) for an animation';
        callback.call(errMsg, errMsg);
    }
    tempFS.mkdir('tmp', function(err, dirPath) {
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
                    fs.writeFile(filePath, img, function(err) {
                        if (err) {
                            numImgsSaved = -50;
                            return callback.call(errMsg, errMsg);
                        }
                        if (++numImgsSaved === sequence.length) {
                             return makeGif(params, dirPath,callback);
                        }
                    });
                });
            })(i);
        }
    });
}

function makeGif(params, tempDir, callback) {
    var gifPath = path.join(tempDir, 'output.gif');
    var imgSeq = path.join( tempDir, 'img*.jpg');
    params.saveGif = true;

    // Animated GIF
    im.convert(
        ['-delay', '1/1', '-loop', '0', imgSeq, gifPath], 
        // convert -delay 20 -loop 0 input*.gif output.gif // Delay, no loop
        function(err, stdout){
            if (err) return callback.call(err, err );
            return exports.saveImage(params, gifPath, callback);
        }
    );
}

