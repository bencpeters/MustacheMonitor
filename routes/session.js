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
console.log('requires login');	
	if( req.session.user ){
		next();
	} else {
        req.session.prev = req.url;
		res.redirect('/user/login');
	}
}
