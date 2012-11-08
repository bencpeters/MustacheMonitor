var config = require('./config').config;

/**
 * Module dependencies.
 */

var express = require('express')
  , MongoStore = require('connect-mongo')(express)
  , routes = require('./routes')
  , upload = require('./routes/upload')
  , user = require('./routes/user')
  , session = require('./routes/session')
  , http = require('http')
  , path = require('path')
  , hbs = require('hbs');

var db = require('mongoskin').db(config.mongohq.url)
  , imagesAPI = require('./model/image')
  , userAPI = require('./model/user')
  , errors = require('./lib/errors');

db.open(function(err) {
    if (err) {console.log("Error connecting to mongo: " + err);}
});

imagesAPI.setDb(db);
userAPI.setDb(db);

var app = express();

hbs.registerHelper('loggedIn', function(item, options) {
    return this.loggedIn;
});
app.configure(function(){
  app.use(express.errorHandler());
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: config.secret,
      store: new MongoStore({url: config.mongohq.url})}));
  app.use(function(req, res, next) {
        res.locals.loggedIn = (function() {
            if (req.session && req.session.user) {
                return true;
            } else {
                return false;
            }
        })();
        next();
  });
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
  app.use(errors.errorHandling);
});

  app.locals({
        imagesAPI: imagesAPI,
        userAPI: userAPI
  });


//admin/testing routes
app.get('/images/delete/:imageId', session.isMustacheAficionado, session.requiresLogin, routes.deleteImage);
app.get('/user/generate', session.isMustacheAficionado, session.requiresLogin, user.generateGifFromSequence);
app.get('/user/images/delete', session.isMustacheAficionado, session.requiresLogin, user.deleteAllImages);
app.get('/user/animations/delete', session.isMustacheAficionado, session.requiresLogin, user.deleteAllGifs);
app.get('/upload', session.isMustacheAficionado, session.requiresLogin, upload.uploadPage);

//loggedin user routes
app.get('/image/:imageId', session.requiresLogin, routes.viewImage);
app.get('/user', session.requiresLogin, user.index );
app.get('/user/edit', session.requiresLogin, user.edit);
app.get('/user/logout', session.requiresLogin, user.logout );
app.get('/user/sequence/:gifHash', session.requiresLogin, user.getSequence);
app.get('/user/images', session.requiresLogin, user.getImages);
app.get('/user/animations', session.requiresLogin, user.getAnimations);
app.post('/user/addimage', session.requiresLogin, user.addImage);
app.post('/user/setsequence', session.requiresLogin, user.setSequence);
app.post('/user/generate', session.requiresLogin, user.generateGif);
app.delete('/user/images', session.requiresLogin, user.deleteAllImages);
app.delete('/user/animations', session.requiresLogin, user.deleteAllGifs);
app.delete('/image/:imageId', session.requiresLogin, routes.deleteImage);

//public routes
app.get('/', routes.index);
app.get('/user/login', user.login );
app.post('/user/login', user.processLogin );
app.get('/user/create', user.createPage);
app.post('/user/create', user.create);
app.get('/user/:screenName', user.getUserPage );
app.get('/user/:screenName/:gifHash', user.getAnimationPage );
app.get('/user/:screenName/:gifHash/gif', user.getGif);

//upload routes
app.post('/upload', session.requiresLogin, upload.uploadImage);

//catch-alls for errors and not found
app.all('/404', function(req, res) { 
    var status = req.session.errorStatus ? req.session.errorStatus : 404;
    delete req.session.errorStatus;
    res.status(status).render('404', {title: 'I Mustache Your Forgiveness'}); 
});
app.all('/500', function(req, res) { throw { msg: 'Hit 500 path', status: 500}; });
app.all('*', function(req, res) { throw { msg: 'Invalid route', status: 404}; });

process.on('uncaughtException', function(err) {
    console.log('uncaughtException: ' + err);
    console.log(err.stack);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
