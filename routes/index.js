
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
            if (err) { return res.send('Error getting image: ' + err); }
            res.contentType('image/jpg');
            res.end(data);
        });
  });
};
