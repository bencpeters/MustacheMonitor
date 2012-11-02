/*
 * Session
 */

exports.requiresLogin = requiresLogin;

exports.index = function(req, res){
  res.send("session index");
};

exports.create = function(req, res){
  res.send("session create");
};

function requiresLogin( req, res, next ){
	if( req.session.user ){
		next();
	} else {
		res.redirect('/session/create?redir=' + req.url );
	}
}