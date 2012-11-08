exports.uploadImage = function(req, res, next) {

    var imagesAPI = req.app.locals.imagesAPI;
    if (req.files.displayImage.size > 0) {
        imagesAPI.saveImage({api: req.app.locals.userAPI,
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
