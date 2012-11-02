exports.uploadImage = function(req, res, next) {
    var imagesAPI = req.app.locals.imagesAPI;
    imagesAPI.saveImage('blah', req.files.displayImage.path,
        function(err, id) {
        if (err) { return res.send('Error: ' + err, 500); }
        res.contentType('application/json');
        res.send({ 'id': id });
    });
};

exports.uploadPage = function(req, res, next) {
    res.render('upload', {title: 'Upload Test'});
};
