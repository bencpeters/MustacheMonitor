
/*
 * GET users listing.
 */

var users = {
	'stache': {username: 'stache', password: 'curly', role: 'user'}
};

exports.authenticate = userAuthenticate;
exports.login = userLogin;
exports.processLogin = userLogin;
exports.logout = userLogout;

exports.index = function(req, res){
  var _user = req.session.user;
  _user.title = 'User';
  res.render('user', _user );
};

exports.createPage = function(req, res, next){
    if (req.session.errors) {
        var errors = req.session.errors;
        delete req.session.errors;
    } else {
        errors = "";
    }
	if( req.session.user ) res.redirect("/user");
	res.render('user-create', {title: "Create User",
                               errors: errors} );
};

exports.create = function(req, res, next) {
    req.app.locals.userAPI.createUser(req.body, function(err, user) {
        if (err) {
            req.session.errors = err;
            return res.redirect('/user/create');
        }
        return res.redirect('/user/' + user._id);
    });
}

// Functions
function userLogout(req, res, next){

	if( req.session.user ){
		delete req.session.user;
	}
	 
	res.redirect('/user');
}

function userLogin(req, res, next){

	if( req.session.user ) res.redirect("/user");

	if( req.body.password && req.body.password.length ){
		exports.authenticate( req.body.username, req.body.password, function( user ){
			
			if( user ){
				req.session.user = user;
				res.redirect("/user");
			} else {
				res.render('login', { error:'Invalid username or password.', title: 'Error' });
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
