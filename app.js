var config = require('./config').config;

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , upload = require('./routes/upload')
  , user = require('./routes/user')
  , session = require('./routes/session')
  , http = require('http')
  , path = require('path')
  , hbs = require('hbs');

var db = require('mongoskin').db(config.mongohq.host)
  , imagesAPI = require('./model/image')
  , userAPI = require('./model/user');

imagesAPI.setDb(db);

var app = express();
var MemStore = require('connect').session.MemoryStore;

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 's3cret$t@che', store: MemStore({
    reapInterval: 6000 * 10
  })}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.locals['imagesAPI'] = imagesAPI;
app.locals['userAPI'] = userAPI;

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/images/view/:imageId', routes.viewImage);

// user routes
app.get('/user', session.requiresLogin, user.index);
app.get('/user/create', session.requiresLogin, user.create);
app.post('/user/login', user.login );

// session routes
app.get('/session', session.index );
app.get('/session/create', session.create );

//upload routes
app.get('/upload', imagesAPI, upload.uploadPage);
app.post('/upload', imagesAPI, upload.uploadImage);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
