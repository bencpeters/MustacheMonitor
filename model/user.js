var db
  , ObjectId = require('mongoskin').ObjectID
  , imagesApi = require('../model/image');

var pwHash = require('password-hash');

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
exports.deleteAnimationFromUser = deleteGif;
exports.deleteAllImages =  function(user, callback) { 
    return deleteAllImages(user, userImages, deleteImage, callback);
};
exports.deleteAllGifs = function(user, callback) {
    return deleteAllImages(user, userGifs, deleteGif, callback);    
};

function setDb(database) {
    db = database;
    imagesApi.setDb(db);
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

function userGifs (user, callback) {
    var id = new ObjectId(user);
    db.collection('users').findById(id, {animations: 1, _id:0},
        function(err, res) {
        if(err) { return callback.call(null, err); }
        return callback.call(res, null, res.animations);
    });
}

function userImages (user, callback) {
    var id = new ObjectId(user);
    db.collection('users').findById(id, {images: 1, 
        _id: 0}, function(err, res) {
        if (err) { return callback.call(err, err); }
        return callback.call(res, null, res.images);
    });
}

function addImageToUser(params, callback) {
    var imageID = params.imageId;
    var user = params.userId;
    var saveGif = params.saveGif;
    if (saveGif) {
        var title = (params.title !== null && typeof params.title !== 'undefined')
        ? params.title : "My Awesome Stache";
        var time = new Date().getTime();
        db.collection('users').updateById(user, {$push : { 'animations' :
            {gif: imageID, title: title, time: time, sequence: params.sequence}}},
            function(err, res) {
            if (err) { return callback.call(imageID, err); }
            return callback.call(res, null, res);
        });
    } else {
        db.collection('users').updateById(user, {$push : { 'images' :
            imageID}}, function(err, res) {
            if (err) { return callback.call(imageID, err); }
            return callback.call(res, null, res);
        });
    }
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
    
    if (userObj.screenName === 'login' || userObj.screenName === 'create') {
        errors.push({msg: 'Screen Name is invalid'});
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
    db.collection('users').findOne({'screenName': user, $or : [{'images' : 
        {$elemMatch : {$in : [hash]}}}, {animations : {$elemMatch : {'gif':hash}}}]}, 
        {_id : 0, 'images' : {$elemMatch : {$in :[hash]}}, 'animations' :
        {$elemMatch : {'gif':hash}}}, function(err, res) {
        if (err) { return callback.call(hash, err); }
        if (res === null) { return callback.call(hash, 'Invalid Hash'); }
        if (res.animations) {
            return callback.call(res.animations[0], null, hash);
        } else {
            return callback.call(hash, null, hash);
        }
    });
}

function getUserByScreenName(user, callback) {
    db.collection('users').findOne({"screenName": user}, function(err, res) {
        if( err ) { return callback.call(err, err); }
        if( res ) return callback.call( res, null, res);

        var errMsg = 'Error, screenname ' + user + ' not found';
        return callback.call(errMsg, errMsg);
    });

}

function deleteImage(user, hash, callback) {
    db.collection('users').updateById(user, {$pull : {'images' : hash}},
        function(err, res) {
        if (err) { return callback.call(hash, err); }
        return callback.call(res, null, res);
    });
}

function deleteGif(user, hash, callback) {
    db.collection('users').updateById(user,
        {$pull : {'animations' : {'gif' : hash} } }, function(err, res) {
        if (err) { return callback.call(hash, err); }
        return callback.call(res, null, res);
    });
} 

function deleteAllImages(user, getImage, deleteImage, callback) {
    getImage(user, function(err, res) {
        if (err) { return callback.call(err, {msg: err}); }
        if (typeof res === 'undefined' || typeof res.length === 'undefined' || 
            res.length < 1) {
            return callback.call(res, {msg:'No images found'});
        }
        var response = { errors: [], successes: [] };
        for (var i=0; i < res.length; ++i) {
            res[i] = res[i].hasOwnProperty('gif') ? res[i].gif : res[i];
            imagesApi.deleteImage(res[i], function(err, id) {
                if (err) { 
                    response.errors.push({id: this, msg: err}); 
                    if (response.errors.length + response.successes.length
                        === res.length) {
                        return callback.call(response, response.errors,
                            response.successes);
                    }
                } else {
                    deleteImage(user, id, function(err) {
                        if (err) {
                            response.error.push({id: this, msg: err});
                        } else {
                            response.successes.push({id: id});
                        }
                        if (response.errors.length + 
                            response.successes.length 
                            === res.length) {
                            var errors = response.errors.length > 0 ?
                                response.errors : null;
                            return callback.call(response, errors,
                                response.successes);
                        }
                    });
                }
            });
        }
    });
}

function getUserByScreenName(user, callback) {
    db.collection('users').findOne({"screenName": user}, {'password': 0}, function(err, res) {
        if( err ) return callback.call(err, err);
        if( res ) return callback.call( res, null, res);

        return callback.call(user, 'User not found');
    });
}
