/**
 * Module dependencies.
 */
var cl = require('cluster');
var numCPUs = require('os').cpus().length;
var express = require('express');
var session = require('express-session');
var routes = require('./routes');
var user = require('./routes/user');
// var mysql_api = require('./routes/mysql_api');
var http = require('http');
var path = require('path');
var i18next = require('i18next');
var i18nextMiddleware = require('i18next-express-middleware');
var Backend = require('i18next-node-fs-backend');
var MemcachedStore = require('connect-memcached')(session);
var mysql = require("mysql");

var app = express();



// var mysql = require("mysql");
// var con = mysql.createPool({
//   host: "582c1a40635ca.sh.cdb.myqcloud.com",
//   port: '5079',
//   user: "ruian",
//   password: "ruian123",
//   database: "ruian"
// });
// app.use(function (req, res, next) {
//   req.con = con;
//   next();
// });


i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      // keys or params to lookup language from
      lookupQuerystring: 'lang'
    },
    fallbackLng: 'zh-CN',
    preload: ['en', 'zh', 'zh-CN'],
    saveMissing: true
  });

// all environments
app.set('port', process.env.PORT || 8097);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(i18nextMiddleware.handle(i18next));
app.enable('trust proxy');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('bdcws'));
app.use(session({
  resave: true,
  saveUninitialized: false,
  secret: 'CatOnKeyboard'
  , key: 'test'
  , proxy: 'true'
  , store: new MemcachedStore({
    hosts: [process.env.CACHE_SERVER],
    secret: '123, easy as ABC. ABC, easy as 123' // Optionally use transparent encryption for memcache session data
  })
}));
// app.use(express.cookieSession());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.login);
app.get('/config', routes.config);
app.get('/login', routes.loginAndSave);
app.post('/login/save', routes.save);
app.get('/logout', routes.logout);
app.get('/role', routes.role);
app.get('/getPage', routes.getPage);
app.get('/vehicle', routes.vehicle);
app.get('/device', routes.device);
app.get('/monitor', routes.monitor);
app.get('/geofence', routes.geofence);
app.get('/playback', routes.playback);
app.get('/trace', routes.trace);
app.get('/report', routes.report);
app.get('/alert', routes.alert);
app.get('/command', routes.command);
app.get('/customer', routes.customer);
app.get('/member', routes.member)
app.get('/summary', routes.summary);
app.get('/depart', routes.depart);
app.get('/employee', routes.employee);
app.get('/account', routes.account);
app.get('/demo', routes.demo);
app.get('/dataman', routes.dataman);
app.get('/datalog', routes.datalog);
app.get('/message', routes.message);
app.get('/ad', routes.ad);
app.get('/article', routes.article);
app.get('/booking', routes.booking);
app.get('/branch', routes.branch);
app.get('/callback', routes.callback);
app.get('/exists', routes.exists);
// app.get('/planId', routes.planId)
app.get('/card_management', routes.card_management)
app.get('/serviceplan', routes.serviceplan)
app.get('/restart', function (req, res) {
  process.exit(0);
});



// app.get('/usecar', routes.usecar);
// app.get('/repair_car', routes.repaircar);
// app.get('/usecar_detail', routes.usecar_detail);
// app.get('/usecar_apply', routes.usecar_apply);
// app.get('/repaircar_detail', routes.repaircar_detail);
// app.get('/repaircar_apply', routes.repaircar_apply);
// app.get('/repair_accident', routes.repair_accident);

// app.get('/mysql_api/list', mysql_api.list);
// app.get('/mysql_api/update', mysql_api.update);
// app.get('/mysql_api/create', mysql_api.create);
// app.get('/mysql_api/delete', mysql_api.delete);


if (process.env.NODE_ENV == "development") {
  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
} else {
  if (cl.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
      cl.fork();
    }

    // As workers come up.
    cl.on('listening', function (worker, address) {
      console.log("A worker with #" + worker.id + " is now connected to " +
        address.address + ":" + address.port);
    });

    cl.on('exit', function (worker, code, signal) {
      console.log('worker ' + worker.process.pid + ' died');
      cl.fork();
    });
  } else {
    // Workers can share any TCP connection
    // In this case its a HTTP server
    http.createServer(app).listen(app.get('port'), function () {
      console.log("Express server listening on port " + app.get('port'));
    });
  }
}

