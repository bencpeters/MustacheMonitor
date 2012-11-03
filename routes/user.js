
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
exports.generateGif = generateGif;
exports.generateGifFromSequence = generateGifFromSequence;
exports.getAnimationPage = getAnimation;
exports.getGif = getGif;

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
        req.session.user = user;
        return res.redirect('/user');
    });
}

// Functions
function getAnimation(req, res, next){
	req.app.locals.userAPI.checkGifHash( req.params.screenName, req.params.gifHash, function( err, hash ){
		if ( err ) return next();
        res.render("user-animation");
	});
}

function getGif(req, res, next) {
    req.app.locals.userAPI.checkGifHash(req.params.screenName, req.params.gifHash, function(err, hash) {
        if (err) { return next(); }
        req.app.locals.imagesAPI.getImage(hash, function(err, data) {
            if (err) { return next(); }
            res.contentType('image/gif');
            res.end(data);
        });
    });
}

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
        if (typeof seq === 'undefined') {
            seq = [];
        } else {
            seq = seq.sequence;
            var newSeq = new Array();
            for (var i=0; i < seq.length; ++i) {
                newSeq.push({id: seq[i]}); 
            }
            seq = newSeq;
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

function generateGif(req, res, next) {
    req.app.locals.imagesAPI.createGif({sequence: req.body.sequence,
        api: req.app.locals.userAPI}, function(err, res) {
        if (err) { return res.send(err, 500); }
        res.send(res);
    });
}

function generateGifFromSequence(req, res, next) {
    req.app.locals.userAPI.getUserSequence(req.session.user._id, function(err, result) {
        if (err) { return res.send(err, 500); }
        req.app.locals.imagesAPI.createGif({sequence: result.sequence,
            api: req.app.locals.userAPI,
            id: req.session.user._id }, function(err, result) {
            if (err) { return res.send(err, 500); }
            res.send(result);
        });
    });
}
