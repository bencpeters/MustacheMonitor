
/*
 * GET home page.
 */

exports.index = function(req, res, next){
  res.render('index', { title: 'Home' });
};

exports.viewImage = function(req, res, next) {
  req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName, 
      req.params.imageId, function(err, hash) {
        if (err) { return res.send(err, 500); }
        req.app.locals.imagesAPI.getImage(hash, function(err, data) {
            if (err) { return next(); }
            res.contentType('image/jpg');
            res.end(data);
        });
  });
};

exports.deleteImage = function(req, res, next) {
    req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName,
        req.params.imageId, function(err, hash) {
        if (err) { return res.send(err, hash); }
        req.app.locals.imagesAPI.deleteImage(hash, function(err, data) {
            if (err) { return res.send(err, 500); }
            req.app.locals.userAPI.deleteImageFromUser(req.session.user._id, req.params.imageId, function(err, hash) {
                if (err) { return res.send(err, 500); }
                res.send('Image ' + req.params.imageId + ' deleted!');
            });
        });
    });
};
