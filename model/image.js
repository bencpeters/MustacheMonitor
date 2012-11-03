var db
  , gsFile = require('mongoskin').GridStore
  , ObjectId = require('mongoskin').ObjectID;

exports.setDb = setDb;
exports.getImage = getImage;
exports.saveImage = saveImage;
exports.deleteImage = deleteImage;

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
            user.api.addImageToUserSequence(id, user.id, function(err,res) {
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
