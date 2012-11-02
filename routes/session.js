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

function requiresLogin( req, res ){
	console.log(req.session);
	if( req.session.user ){
		res.render('user');
	} else {
		res.redirect('/session/create?redir=' + req.url);
	}
}