const express = require('express');
const session = require('express-session') 
const config = require('./config');
const ecache  = require('./server/ensureProcessingCache.js');
const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const users = [{  
  username: 'AirLiquide',
  password: 'AirLiquide',
  id: 1
}];


var app = express();
var port = config.web.port;
var baseStatic = config.web.baseStatic;
app.use(express.static(baseStatic));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());


var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
}
var getUserByUserName= function(username){
     for(i=0;i<users.length;i++){
        if(users[i].username == username){
            return users[i];
        }
    }
}

var getUserById= function(id){
     for(i=0;i<users.length;i++){
        if(users[i].id == id){
            return users[i];
        }
    }
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, getUserById(id));
});

passport.use(new LocalStrategy(
  function(username, password, done) {
      var user =getUserByUserName(username); 
      if (!user) {
        return done(null, false);
      }
      if (user.password != password) {
        return done(null, false);
      }
      return done(null, user);
  }
));


app.set('view engine','ejs');
app.get('/favicon.ico', function(req, res,next) {
    res.sendStatus(204);
});
app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                failureFlash: false})
);
app.get('/login',function(req,res,next){
    res.render("login");
});

app.get('/',isAuthenticated,
    function(req,res,next){
        if(req.query.pdb && req.query.pdb.length == 4 ){
            res.redirect('/'+req.query.pdb+'?cutoff=high');
        }
        if(req.query.pdb2 && req.query.pdb2.length == 4 ){
            res.redirect('/'+req.query.pdb2+'?cutoff=high');
        }
        res.render(
            "overview",
            {
                proteinListGoogleSpreadsheet:config.web.proteinListGoogleSpreadsheet,
                baseWebsite:config.web.baseWebsite
            }
        ); 
    }
);

app.get(
    '/:pdb/',isAuthenticated,
    function(req,res,next){
        res.render(
            "jolecule",
            {
                pdb:req.params.pdb,
                energyCutoffSet:req.query.cutoff||Object.keys(config.jolecule.ENERGY_CUTOFF_SETS)[0]
            }
        ); 
    }
);

app.get(
    '/getMaps/:pdb/:energyCutoffSet/',isAuthenticated,
    function(req, res, next){        
        ecache.checkFilesAndReturnJSON(req,res);
    });   

app.get(
    '/flushCache/:pdb/:energyCutoffSet/',isAuthenticated,
    function(req, res, next){
        ecache.flushCache(req,res);
    });
app.get(
    '/data/:pdb/:energyCutoffSet/:index/',isAuthenticated,
    function(req, res, next){     
        ecache.retrieveCache(req,res)
            .then(function(dataServer){
                res.setHeader('content-type', 'text/javascript');
                res.write(dataServer);
                res.end();
            })
            .catch(function(err){
                    res.status(404).send(err);
            });
    });   

app.use(function (req, res, next) {
   res.redirect('/login');
});


var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port);
});

