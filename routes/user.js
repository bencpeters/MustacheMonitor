
/*
 * GET users listing.
 */
var config = require('../config').config
  , path = require('path')
  , crypto = require('crypto')
  , util = require('../lib/helpers');

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
exports.deleteAllImages = deleteAllImages;
exports.deleteAllGifs = deleteAllGifs;

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
	if( req.session.user ) {
        return res.redirect("/user");
    }
    res.status(400);
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
	req.app.locals.userAPI.getUserByScreenName(req.params.screenName,
        function(err, user) {
        if (err) { return next(err); }
        if (user) {
        	var email = user.email.toLowerCase();
            var args = {
            	screenName: user.screenName
            	,animations: []
                ,emailHash: crypto.createHash('md5').update(email).digest("hex")
            };

            for (var i=0; i < user.animations.length; ++i) {
                args.animations.push({
                	gif: util.getGifPath(user.animations[i].gif, user.screenName),
                    link: util.getAnimationPagePath(user.animations[i].gif, user.screenName),
                    title: user.animations[i].title
                });
            }
            return res.render('user-public', { title: user.screenName,
                user: args
            });
		} else {
            return next();
        }
	});
}

function getAnimation(req, res, next){
	req.app.locals.userAPI.checkImageOwnership(req.params.screenName,
        req.params.gifHash, function(err, hash) {
		if (err) { return next(err) };
		var url = 'http://' + req.headers.host + req.url;
		var gifUrl = 'http://' + path.join(req.headers.host, req.url, 'gif');
		var gifTitle = this.title;
                if (this.time) {
                    var gifDate = util.getDateString(new Date(this.time));
                } else {
                    var gifDate = 'Nov 3<sup>rd</sup>, 2012';
                }
		req.app.locals.userAPI.getUserByScreenName(req.params.screenName,
            function(err, user) {
            if (err) { return next(err); }
			var email = user.email.toLowerCase();
			var emailHash = crypto.createHash('md5').update(email).digest("hex");
        	return res.render("user-animation", {title: gifTitle,
                gifTitle: gifTitle,
                gifDate: gifDate,
                url: url,
                gifUrl: gifUrl,
                screenName: req.params.screenName,
                emailHash: emailHash 
            });
		});
	});
}

function getGif(req, res, next) {
    req.app.locals.userAPI.checkImageOwnership(req.params.screenName, req.params.gifHash, function(err, hash) {
        if (err) { return next(err); }

        req.app.locals.imagesAPI.getImage(hash, function(err, data) {
            if (err) { return next(err); }
            res.contentType('image/gif');
            res.header('Cache-Control', 'public, max-age=2592000');
            res.header('Expires', new Date(Date.now() + 2592000000).toUTCString());
            res.header('ETag', '"'+req.params.gifHash+'"' );
            res.header('Last-Modified', new Date(Date.now() - 360000).toUTCString()); // TODO: Use image timestamp
            if( req.header('If-None-Match') === '"'+req.params.gifHash+'"' ){
                res.writeHead(304, res.headers);
                res.end();
            } else res.end(data);
        });
    });
}

function userLogout(req, res, next){
	if(req.session.user) {
		delete req.session.user;
	}
	 
	res.redirect('/user');
}

function userLogin(req, res, next){
	if(req.session.user) { 
        var url = req.session.prev ? req.session.prev : '/user';
        res.redirect(url); 
    }

	if( req.body.password && req.body.password.length ){
        req.app.locals.userAPI.authenticateUser(req.body.screenName,
            req.body.password, function(err, user) {
			if (user) {
                var url = req.session.prev ? req.session.prev : '/user';
                req.session.user = user;
                res.redirect(url);
			} else {
                res.status(400);
				res.render('login', { error: err,
                    title: 'User Login | Error'});
			}
		});

	} else {
		res.render("login", { title: "User Login" });
	}
};

function getSequence(req, res, next) {
    req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName,
        req.params.gifHash, function(err, hash) {
        if (err) { return next(err); }
        req.app.locals.userAPI.getUserGifs(req.session.user._id,
            function(err, images) {
            if (err) { return next(err); }
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
                return next('Animation not found');
            }
        });
    });
}

function getImages(req, res, next) {
    req.app.locals.userAPI.getUserImages(req.session.user._id,
        function(err, images) {
        if (err) { return next(err); }
        if (typeof images === 'undefined') {
            return next({msg: 'Bad user account found: ' + 
                req.session.user._id, status: 500});
        }
        for (var i=0; i < images.length; ++i) {
            images[i] = {id: images[i], block: ( ( (i % 3 == 0 ) ? 'a' : ( (i % 2) ? 'b' : 'c' ) ) )  };
        }
        res.contentType('application/json');
        res.send(images);
    });
}

function getAnimations(req, res, next) {
    req.app.locals.userAPI.getUserGifs(req.session.user._id,
        function(err, images) {
        if (err) { return next(err); }
        if (typeof images === 'undefined') {
            return next({msg: 'Bad user account found: ' + 
                req.session.user._id, status: 500});
        }
        res.contentType('application/json');
        return res.send(images);
    });
}

function addImageToSequence(req, res, next) {
    req.app.locals.userAPI.addImageToUserSequence(req.body.imageId,
        req.session.user._id, function(err, seq) {
        if (err) {
            return next(err);
        }
        res.send(seq);
    });
};

function generateGif(req, res, next) {
    req.app.locals.imagesAPI.createGif({sequence: req.body.sequence,
        api: req.app.locals.userAPI,
        id: req.session.user._id }, function(err, result) {
        if (err) { return next(err); }
        result = { id: result,
                   url: util.getGlobalAnimationPagePath(result,
                       req.session.user.screenName)};
        res.send(result);
    });
}

function generateGifFromSequence(req, res, next) {
    req.app.locals.userAPI.getUserImages(req.session.user._id, 
        function(err, result) {
        if (err) { return next(err); }
        req.app.locals.imagesAPI.createGif({sequence: result,
            api: req.app.locals.userAPI,
            id: req.session.user._id }, function(err, result) {
            if (err) { return next(err); }
            result = { id: result,
                       url: util.getGlobalAnimationPagePath(result,
                           req.session.user.screenName)};
            res.send(result);
        });
    });
}

function deleteAllImages(req, res, next) {
    req.app.locals.userAPI.deleteAllImages(req.session.user._id, 
        function(err, result) {
        if (err && err.hasOwnProperty('msg')) { return next(err.msg); }
        res.render('delete-images', { title: 'Delete Images',
            errors: err,
            successes: result});
    });
}

function deleteAllGifs(req, res, next){
    req.app.locals.userAPI.deleteAllGifs(req.session.user._id,
        function(err, result) {
        if (err && err.hasOwnProperty('msg')) { return next(err.msg); }
        res.render('delete-images', { title: 'Delete Images',
            errors: err,
            successes: result});
    });
}
