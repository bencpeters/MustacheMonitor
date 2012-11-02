var db;

var pwHash = require('password-hash');

exports.setDb = setDb;

exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.authenticateUser = authenticateUser;

function setDb(database) {
    db = database.db;
}

function createUser(user, callback) {
    validateUser(user, function(err) {
        if (err) { return callback.call(err, err); }
        db.collection('users').insert(user, {safe:true},
            function(err, res) {
            if (err) { return callback.call(err, err); }
            return callback.call(res, null, res);
        });
    });
}

function deleteUser(callback) {

}

function authenticateUser(callback) {

}

function validateUser(user, callback) {
    var errors = new Array();
    var userObj = {};
    if (!user.hasOwnProperty('email')) {
        errors.push({msg: 'Need to specify an email'});
    } else {
        userObj['email'] = user.email;
    }
    var passwordChecks = true;
    if (!user.hasOwnProperty('password')) {
        errors.push({msg: 'No password specified'});
        passwordChecks = false;
    }
    if (!user.hasOwnProperty('passwordConfirmation')) {
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
    if (!user.hasOwnProperty('firstName')) {
        errors.push({msg: 'No first name specified'});
    } else {
        userObj['firstName'] = user.firstName;
    }
    if (!user.hasOwnProperty('lastName')) {
        errors.push({msg: 'No last name specified'});
    } else {
        userObj['lastName'] = user.lastName;
    }
    if (!user.hasOwnProperty('screenName') && userObj.hasOwnProperty('email')) {
        userObj['screenName'] = userObj.email;
    } else if (user.hasOwnProperty('screenName')) {
        userObj['screenName'] = user.screenName;
    }

    if (errors.length === 0) {
        db.collection('users').find({screenName: userObj.screenName}, 
            {'limit': 1, '_id' : 1}, function(err, res) {
            if (err) { return callback.call(err, err); }
            if (res.size() > 0) {
                errors.push({msg: 'Screen name already taken!'});
            }
            db.collection('users').find({email: userObj.email}, 
                {'limit': 1, '_id':1}, function(err, res) {
                if (err) { return callback.call(err, err); }
                if (res.size() > 0) {
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
