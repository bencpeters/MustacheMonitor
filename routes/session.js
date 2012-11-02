exports.requiresLogin = requiresLogin;

function requiresLogin( req, res, next ){
	if( req.session.user ){
		next();
	} else {
		res.redirect('/sessions/new?redir=' + req.url );
	}
}