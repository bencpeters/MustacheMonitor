
/*
 * GET users listing.
 */

var users = {
	'stache': {username: 'stache', password: 'curly', role: 'user'}
};

exports.login = userLogin;
exports.processLogin = userLogin;
exports.logout = userLogout;
exports.getSequence = getSequence;
exports.addImage = addImageToSequence;

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
    res.status(406);
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
        req.app.locals.userAPI.authenticateUser(req.body.screenName,
            req.body.password, function(err, user) {
			if( user ){
                var url = req.session.prev ? req.session.prev : '/user';
                req.session.user = user;
                res.redirect(url);
			} else {
                res.status(401);
				res.render('login', { error: err, title: 'Error'});
			}
		});

	} else {
		res.render("login", { title: "User Login" });
	}
};

function getSequence(req, res, next) {
    req.app.locals.userAPI.getUserSequence(req.session.user._id,
        function(err, seq) {
        if (err) {
            return res.send(err, 500);
        }
        res.contentType('application/json');
        res.send(seq);
    });
};

function addImageToSequence(req, res, next) {
    req.app.locals.userAPI.addImageToUserSequence(req.body.imageId,
        req.session.user._id, function(err, seq) {
        if (err) {
            return res.send(err, 500);
        }
        res.send(seq);
    });
};
