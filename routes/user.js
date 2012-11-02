
/*
 * GET users listing.
 */

var users = {
	'stache': {username: 'stache', password: 'curly', role: 'user'}
};

exports.authenticate = userAuthenticate;
exports.login = userLogin;
exports.processLogin = userLogin;

exports.index = function(req, res){
  var _user = req.session.user;
  _user.title = 'User';
  res.render('user', _user );
};

exports.create = function(req, res, next){
	res.send("user create");
};


// Functions

function userLogin(req, res, next){
	
	if( req.session.user ) res.redirect("/user");

	if( req.body.password && req.body.password.length ){
		exports.authenticate( req.body.username, req.body.password, function( user ){
			
			if( user ){
				req.session.user = user;
				res.redirect("/user");
			} else {
				res.render('login', { error:'Invalid username or password.' });
			}
		});
		
	} else {
		res.render("login", { title: "User Login" });
	}
};

function userAuthenticate( username, password, callback ){

	var user = users[username];
	
	if( !user ){
		callback.call( null, null );
		return;
	}
	
	if( user.password == password ){
		callback.call( null, user );
		return;
	}
	
	callback.call( null, null );
};
