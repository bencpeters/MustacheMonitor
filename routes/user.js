
/*
 * GET users listing.
 */

var users = {
	'stache': {username: 'stache', password: 'curly', role: 'user'}
};
var config = require('../config').config;

exports.login = userLogin;
exports.processLogin = userLogin;
exports.logout = userLogout;
exports.getSequence = getSequence;
exports.getImages = getImages;
exports.getAnimations = getAnimations;
exports.addImage = addImageToSequence;
exports.generateGif = generateGif;
exports.generateGifFromSequence = generateGifFromSequence;
exports.getAnimationPage = getAnimation;
exports.getGif = getGif;
exports.getUserPage = getUserPage;

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
function getUserPage(req, res, next){

	req.app.locals.userAPI.getUserByScreenName(req.params.screenName,function( err, user ){

		if( user ){
			delete user._id;
			res.render('user-public',{ title: user.screenName, user: user });
		} else next();

	});
}


function getAnimation(req, res, next){
	req.app.locals.userAPI.checkImageOwnership( req.params.screenName, req.params.gifHash, function( err, hash ){
		if ( err ) return next();
		var url = 'http://' + req.headers.host + req.url;
		var gifUrl = 'http://' + require('path').join( req.headers.host, req.url, 'gif');
		console.log(gifUrl);
		var gifTitle = 'My Awesome Stache';

		req.app.locals.userAPI.getUserByScreenName(req.params.screenName,function( err, user ){
			var email = user.email.toLowerCase();
			var emailHash = require('crypto').createHash('md5').update(email).digest("hex");
        	res.render("user-animation", {title: gifTitle, gifTitle: gifTitle, url: url, gifUrl: gifUrl, screenName: req.params.screenName, emailHash: emailHash });

		});

	});
}

function getGif(req, res, next) {
    req.app.locals.userAPI.checkImageOwnership(req.params.screenName, req.params.gifHash, function(err, hash) {
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
    req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName,
        req.params.gifHash, function(err, hash) {
        if (err) { return res.send(err, 500); }
        req.app.locals.userAPI.getUserGifs(req.session.user._id,
            function(err, images) {
            if (err) { return res.send(err, 500); }
            var theSequence = null;
            for(var i=0; i < images.length; ++i) {
                if (images[i].gif === hash) {
                   theSequence = images[i];
                   break;
                }
            }
            if (theSequence) {
                for(var i=0; i < theSequence.sequence.length; ++i) {
                    theSequence.sequence[i] = {id:
                        theSequence.sequence[i]};
                }
                res.contentType('application/json');
                return res.send(theSequence.sequence);
            } else {
                return res.send('Animation not found', 404);
            }
        });
    });
}

function getImages(req, res, next) {
    req.app.locals.userAPI.getUserImages(req.session.user._id,
        function(err, images) {
        if (err) { return res.send(err, 500); }
        if (typeof images === 'undefined') {
            return next();
        }
        for (var i=0; i < images.length; ++i) {
            images[i] = {id: images[i]};
        }
        res.contentType('application/json');
        res.send(images);
    });
}

function getAnimations(req, res, next) {
    req.app.locals.userAPI.getUserGifs(req.session.user._id,
        function(err, images) {
        if (typeof images === 'undefined') {
            return next();
        }
        if (err) { return res.send(err, 500); }
        res.contentType('application/json');
        res.send(images);
    });
}

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
        api: req.app.locals.userAPI,
        id: req.session.user._id }, function(err, result) {
        if (err) { return res.send(err, 500); }
        result = { id: result,
                   url: config.baseUrl + '/user/'  + 
            req.session.user.screenName + '/' + result};
        res.send(result);
    });
}

function generateGifFromSequence(req, res, next) {
    req.app.locals.userAPI.getUserImages(req.session.user._id, function(err, result) {
        if (err) { return res.send(err, 500); }
        req.app.locals.imagesAPI.createGif({sequence: result,
            api: req.app.locals.userAPI,
            id: req.session.user._id }, function(err, result) {
            if (err) { return res.send(err, 500); }
            result = { id: result,
                       url: config.baseUrl + '/user/'  + 
                req.session.user.screenName + '/' + result};
            res.send(result);
        });
    });
}
