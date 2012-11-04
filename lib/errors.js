exports.errorHandling = handleError;

function handleError(err, req, res, next) {
    if (err.hasOwnProperty('msg')) {
        console.log(err.msg);
        req.session.errorStatus = err.status;
    } else {
        console.log(err);
        req.errorStatus = 404;
    }
    res.redirect('/404');
}
