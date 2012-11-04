
/*
 * GET home page.
 */

exports.index = function(req, res, next){
  res.render('index', { title: 'Home' });
};

exports.viewImage = function(req, res, next) {
  req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName, 
      req.params.imageId, function(err, hash) {
        if (err) { return next(err); }
        req.app.locals.imagesAPI.getImage(hash, function(err, data) {
            if (err) { return next(err); }
            res.contentType('image/jpg');
            res.end(data);
        });
  });
};

exports.deleteImage = function(req, res, next) {
    req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName,
        req.params.imageId, function(err, hash) {
        if (err) { return next(err); }
        req.app.locals.imagesAPI.deleteImage(hash, function(err, data) {
            if (err) { return next(err); }
            req.app.locals.userAPI.deleteImageFromUser(req.session.user._id, req.params.imageId, function(err, hash) {
                if (err) { return next(err); }
                res.send('Image ' + req.params.imageId + ' deleted!');
            });
        });
    });
};
