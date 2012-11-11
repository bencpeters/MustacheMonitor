
/*
 * GET home page.
 */

exports.index = function(req, res, next){
  res.render('index', { title: 'Share Your Stache' });
};

exports.viewImage = function(req, res, next) {
  req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName, 
      req.params.imageId, function(err, hash) {
        if (err) { return next(err); }
        req.app.locals.imagesAPI.getImage(hash, function(err, data) {
            if (err) { return next(err); }
            res.contentType('image/jpg');
            res.header('Cache-Control', 'public, max-age=2592000');
            res.header('Expires', new Date(Date.now() + 2592000000).toUTCString());
            res.header('ETag', '"'+req.params.imageId+'"' );
            res.header('Last-Modified', new Date(Date.now() - 360000).toUTCString());
            if( req.header('If-None-Match') === '"'+req.params.imageId+'"' ){
                res.writeHead(304, res.headers);
                res.end();
            } else res.end(data);

        });
  });
};

exports.deleteImage = function(req, res, next) {
    //figure out if this is an HTTP POST or GET
    var imageId = (req.params && req.params.imageId) ? req.params.imageId :
        req.body.imageId;
    req.app.locals.userAPI.checkImageOwnership(req.session.user.screenName,
        imageId, function(err, hash) {
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
