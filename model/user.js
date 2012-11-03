var db
  , ObjectId = require('mongoskin').ObjectID;

var pwHash = require('password-hash');
// var crypto = require('crypto');

exports.setDb = setDb;

exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.authenticateUser = authenticateUser;
exports.getUserGifs = userGifs;
exports.getUserImages = userImages;
exports.addImageToUser = addImageToUser;
exports.checkImageOwnership = checkImage;
exports.getUserByScreenName = getUserByScreenName;
exports.deleteImageFromUser = deleteImage;

function setDb(database) {
    db = database;
}

function createUser(user, callback) {
    validateUser(user, function(err, user) {
        if (err) { return callback.call(err, err); }
        db.collection('users').insert(user, {safe:true},
            function(err, res) {
            if (err) { return callback.call(err, err); }
            return callback.call(res[0], null, res[0]);
        });
    });
}

function deleteUser(callback) {

}

function authenticateUser(user, pw, callback) {
    db.collection('users').findOne({'screenName': user}, function(err, res) {
        if (err) { return callback.call(err, err); }
        if (res === null) {
            var errMsg = "Invalid username or password.";
            return callback.call(errMsg, errMsg);
        }
        if (pwHash.verify(pw, res.password)) {
            delete res.password;
            return callback.call(res, null, res);
        } else {
            var errMsg = "Invalid username or password.";
            return callback.call(errMsg, errMsg);
        }
    });
}

function getImagesByUser(user, callback) {
    var id = new ObjectId(user);
    db.collection('users').findById(id, {images: 1, animations: 1, 
        _id: 0}, function(err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(res, null, res);
    });
}

function userImages (user, callback) {
    getImagesByUser(user, function(err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(res.images, null, res.images);
    });
}

function userGifs (user, callback) {
    getImagesByUser(user, function(err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(res.animations, null, res.animations);
    });
}

function addImageToUser(params, callback) {
    var imageID = params.imageId;
    var user = params.userId;
    var saveGif = params.saveGif;
    getImagesByUser(user, function(err, res) {
        if (err) { return callback.call(err, err); }
        var title = (params.title !== null && typeof params.title !== 'undefined')
        ? params.title : "My Awesome Stache";
        if (saveGif) {
            res.animations.push({gif: imageID,
                title: title,
                sequence: params.sequence});
        } else {
            res.images.push(imageID);
        }

        db.collection('users').updateById(user, {$set : { 'animations' :
            res.animations, 'images' : res.images}}, function(err, res) {
            if (err) { return callback.call(err, err); }
            return callback.call(res, null, res);
        });
    });
}

function validateUser(user, callback) {
    var errors = new Array();
    var userObj = {};
    if (user.email.length === 0) {
        errors.push({msg: 'Need to specify an email'});
    } else {
        userObj['email'] = user.email;
    }
    var passwordChecks = true;
    if (user.password.length === 0) {
        errors.push({msg: 'No password specified'});
        passwordChecks = false;
    }
    if (user.passwordConfirmation.length === 0) {
        errors.push({msg: 'No password confirmation specified'});
        passwordChecks = false;
    }
    if (user.password !== user.passwordConfirmation) {
        errors.push({msg: 'Password and password confirmation don\'t match'});
        passwordChecks = false;
    } 
    if (user.password.length < 6) {
        errors.push({msg: 'Password needs to be at least 6 characters'});
        passwordChecks = false;
    }
    if (passwordChecks) {
        userObj['password'] = pwHash.generate(user.password);
    }
    if (user.firstName.length === 0) {
        errors.push({msg: 'No first name specified'});
    } else {
        userObj['firstName'] = user.firstName;
    }
    if (user.lastName.length === 0) {
        errors.push({msg: 'No last name specified'});
    } else {
        userObj['lastName'] = user.lastName;
    }
    if (user.screenName.length === 0 && userObj.hasOwnProperty('email')) {
        userObj['screenName'] = userObj.email;
    } else if (user.screenName.length > 0) {
        userObj['screenName'] = user.screenName;
    } else {
        errors.push({msg: 'Need to specifiy a screen name'});
    }

    if (errors.length === 0) {
        db.collection('users').findOne({screenName: userObj.screenName}, function(err, res) {
            if (err) { return callback.call(err, err); }
            if (res !== null) {
                errors.push({msg: 'Screen name already taken!'});
            }
            db.collection('users').findOne({email: userObj.email}, function(err, res) {
                if (err) { return callback.call(err, err); }
                if (res !== null) {
                    errors.push({msg: 'Email already taken!'});
                }
                if (errors.length > 0) {
                    return callback.call(errors, errors);
                } else {
                    userObj['images'] = new Array();
                    userObj['animations'] = new Array();
                    return callback.call(userObj, null, userObj);
                }
            });
        });
    } else {
            callback.call(errors, errors);
    }
}

function checkImage(user, hash, callback) {
    db.collection('users').findOne({"screenName": user},{"images": 1,
        "animations": 1}, function(err, res) {
        if (err) { return callback.call(err, err); }
        if (res === null || typeof res.images === 'undefined' ||
            typeof res.animations === 'undefined') {
            var errMsg = 'Old DB';
            return callback.call(errMsg, errMsg);
        }
        if (res.images.indexOf(hash) >= 0) {
            return callback.call(hash, null, hash);
        }
        for(var i=0; i < res.animations.length; ++i) {
            if (res.animations[i].gif === hash) {
                return callback.call(hash, null, hash);
            }
        }
        var errMsg = 'Invalid Hash';
        return callback.call(errMsg, errMsg);
    });
}

function getUserByScreenName(user, callback) {
    db.collection('users').findOne({"screenName": user}, function(err, res) {
        if( err ) { return callback.call(err, err); }
        if( res ) return callback.call( res, null, res);

        var errMsg = 'Error, not found';
        return callback.call(errMsg, errMsg);
    });

}

function deleteImage(user, hash, callback) {
    getImagesByUser(user, function(err, res) {
        if (err) { return callback.call(err, err); }
        var index = res.images.indexOf(hash);
        if (index >= 0) {
            res.images.splice(index, 1);
        }
        for (var i=0; i < res.animations.length; ++i) {
            if (res.animations[i].gif === hash) {
                res.animations.splice(i, 1);
                index = i;
                break;
            }
        }
        if (index >= 0) {
            db.collection('users').updateById(user, {$set : { 'animations' :
                res.animations, 'images' : res.images}}, function(err, res) {
                if (err) { return callback.call(err, err); }
                return callback.call(res, null, res);
            });
        }
    });
}

function getUserByScreenName(user, callback) {
    db.collection('users').findOne({"screenName": user}, {'password': 0}, function(err, res) {
        if( err ) return callback.call(err, err);
        if( res ) return callback.call( res, null, res);

        var errMsg = 'Error, not found';
        return callback.call(errMsg, errMsg);
    });

}
