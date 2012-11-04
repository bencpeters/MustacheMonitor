/*
 * Session
 */

var oauth = require('oauth');

exports.requiresLogin = requiresLogin;

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
