exports.uploadImage = function(req, res, next) {
    var imagesAPI = req.app.locals.imagesAPI;
    var saveGif = req.body.isGif ? true : false;
    var title = (req.body.title && req.body.title.length > 0) ? req.body.title : null;
    if (req.files.displayImage.size > 0) {
        //only let admins do large files
        if (!req.session.user.admin && req.files.displayImage.size > 250000) {
            return next('Image too large!');
        }
        imagesAPI.saveImage({api: req.app.locals.userAPI,
            title: title,
            saveGif: saveGif,
            id: req.session.user._id}, req.files.displayImage.path,
            function(err, id) {
            if (err) { return next(err); }
            res.contentType('application/json');
            return res.send({ 'id': id });
        });
    } else {
        return next({msg: 'No image sent!', status: 400});
    }
};

exports.uploadPage = function(req, res, next) {
    res.render('upload', {title: 'Upload Test'});
};

exports.uploadAnimationPage = function(req, res, next) {
    res.render('upload-animation', {title: 'Upload Animation'});
};
