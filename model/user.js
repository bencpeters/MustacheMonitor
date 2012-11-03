var db
  , ObjectId = require('mongoskin').ObjectID;

var pwHash = require('password-hash');

exports.setDb = setDb;

exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.authenticateUser = authenticateUser;
exports.getUserSequence = userSequence;
exports.addImageToUser = addImageToUser;

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

function userSequence(user, callback) {
    console.log('in api call');
    var id = new ObjectId(user);
    db.collection('users').findById(id, {sequences: true, _id: 0}, function(err, res) {
        console.log('found');
        console.log(res);
        if (err) { return callback.call(err, err); }
        return callback.call(res.sequences[0], null, res.sequences[0]);
    });
}

function addImageToUser(params, callback) {
    var imageID = params.imageId;
    var user = params.userId;
    var saveGif = params.saveGif;
    userSequence(user, function(err, res) {
        if (err) { return callback.call(err, err); }
        var gifId = null;
        var sequence = new Array();
        console.log(res);
        if (typeof res !== 'undefined') {
            gifId = res.gif;
            sequence = res.sequence;
        }
        if (saveGif) {
            gifId = imageID;
        } else {
            sequence.push(imageID);
        }
        db.collection('users').updateById(user, {$set : { 'sequences' :
            [{ gif : gifId, sequence : sequence}]}}, function(err, res) {
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
                    userObj['sequences'] = new Array();
                    return callback.call(userObj, null, userObj);
                }
            });
        });
    } else {
            callback.call(errors, errors);
    }
}

exports.checkGifHash = function (user, hash, callback) {
    
    db.collection('users').findOne({"screenName": user},{"sequences.gif": 1}, function(err, res) {
        
        if (err) { return callback.call(err, err); }

        if( res.sequences[0] && res.sequences[0].gif === hash ){
            return callback.call( hash, null, hash );
        }

        return callback.call(err, 'Invalid hash');
    });

}
