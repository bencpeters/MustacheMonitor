exports.uploadImage = function(req, res, next) {
    console.log(req);
    var imagesAPI = req.app.locals.imagesAPI;
    if (req.files.displayImage.size > 0) {
        imagesAPI.saveImage('blah', req.files.displayImage.path,
            function(err, id) {
            if (err) { return res.send('Error: ' + err, 500); }
            res.contentType('application/json');
            res.send({ 'id': id });
        });
    } else {
        res.send('Error: No image sent!', 500);
    }
};

exports.uploadPage = function(req, res, next) {
    res.render('upload', {title: 'Upload Test'});
};
