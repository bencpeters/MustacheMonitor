var db
  , gsFile = require('mongoskin').GridStore
  , ObjectId = require('mongoskin').ObjectID;

exports.setDb = setDb;
exports.getImage = getImage;
exports.saveImage = saveImage;

function setDb(database) {
    db = database.db;
}

function getImage(imageID, callback){
    var id = new ObjectId(imageID);
    console.log(id);
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
            return callback.apply(res, [null, id]); 
        });
    });
}

