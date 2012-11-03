/*
 * Session
 */

var oauth = require('oauth');

exports.requiresLogin = requiresLogin;

exports.index = function(req, res){
  res.send("session index");
};

exports.create = function(req, res){
  res.send("session create");
};

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
