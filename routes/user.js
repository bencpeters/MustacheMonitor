
/*
 * GET users listing.
 */

var users = {
	'stache': {username: 'stache', password: 'curly', role: 'user'}
};

exports.authenticate = userAuthenticate;
exports.login = userLogin;

exports.index = function(req, res){
  res.send("user index");
};

exports.create = function(req, res, next){
	res.send("user create");
};


// Functions

function userLogin(req, res, next){
	console.log("body "+req.body.password);

	if( req.body.password && req.body.password.length ){
		exports.authenticate( req.body.username, req.body.password, function( user ){
			if( user ){
				req.session.user = user;
			} else {
				res.redirect('/session/create');
			}
		});
	} else {
		res.render("login", { title: "User Login" });
	}
};

function userAuthenticate( username, password, callback ){

	var user = users[username];
	if( !user ){
		callback.apply( null, null );
		return;
	}
	if( user.password == password ){
		callback.apply( null, user );
		return;
	}
	
	callback.apply( null, null );
	// res.send("user create");
};
