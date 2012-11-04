/*
 * Session
 */

var oauth = require('oauth');

exports.requiresLogin = requiresLogin;
exports.isMustacheAficionado = isAdmin;

function requiresLogin( req, res, next ){
    var specifiedUserId = req.params.userId;
	if( req.session.user && (typeof specifiedUserId === 'undefined' ||
        specifiedUserId === req.session.user._id)){
		next();
	} else {
        req.session.prev = req.url;
		res.redirect('/user/login');
	}
}

function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.admin) {
        next();
    } else {
        return next({msg:'Someone without a mustache tried to be an admin',
            status:401});
    }
}
