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
  , userAPI = require('./model/user');

db.open(function(err) {
    if (err) {console.log("Error connecting to mongo: " + err);}
});

imagesAPI.setDb(db);
userAPI.setDb(db);

var app = express();

hbs.registerHelper('printError', function(items, options) {
    var out = "";
    for(var i=0; i < items.length; i++) {
        out = out + options.fn(items[i]) + '<br>';
    }
    return out;
});

hbs.registerHelper('userAnimations', function(user, options) {
    var out = "";
    var items = user.animations;
    for(var i=0; i < items.length; i++) {
        out = out + '<a href="/user/'+user.screenName+'/'+items[i].gif+'/" title="'+items[i].title+'"><img src="/user/'+user.screenName+'/'+items[i].gif+'/gif" width="150" alt=""/></a>';
    }
    return out;
});


hbs.registerHelper('loggedIn', function(item, options) {
    return this.loggedIn;
});

app.configure(function(){
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
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

  app.locals({
        imagesAPI: imagesAPI,
        userAPI: userAPI
  });
    

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/images/:imageId', session.requiresLogin, routes.viewImage);
app.get('/images/delete/:imageId', session.requiresLogin, routes.deleteImage);
app.delete('/images/:imageId', session.requiresLogin, routes.deleteImage);

// user routes
app.get('/user', session.requiresLogin, user.index );
app.get('/user/create', user.createPage);
app.post('/user/create', user.create);
app.get('/user/edit', session.requiresLogin, user.edit);
app.get('/user/login', user.login );
app.post('/user/login', user.processLogin );
app.get('/user/logout', user.logout );
app.get('/user/sequence/:gifHash', session.requiresLogin, user.getSequence);
app.get('/user/images', session.requiresLogin, user.getImages);
app.get('/user/animations', session.requiresLogin, user.getAnimations);
app.post('/user/addimage', session.requiresLogin, user.addImage);
app.post('/user/setsequence', session.requiresLogin, user.setSequence);
app.get('/user/generate', session.requiresLogin, user.generateGifFromSequence);
app.post('/user/generate', session.requiresLogin, user.generateGif);
app.get('/user/:screenName', user.getUserPage );
app.get('/user/:screenName/:gifHash', user.getAnimationPage );
app.get('/user/:screenName/:gifHash/gif', user.getGif);

// session routes
app.get('/session', session.index );
app.get('/session/create', session.create );

//upload routes
app.get('/upload', session.requiresLogin, upload.uploadPage);
app.post('/upload', session.requiresLogin, upload.uploadImage);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
