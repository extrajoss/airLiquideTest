const express = require('express');
const session = require('express-session') 
const config = require('./config');
const ecache  = require('./server/ensureProcessingCache.js');
const authentication = require('./server/authentication.js');
/*
const users = [{  
  username: 'AirLiquide',
  password: 'AirLiquide',
  id: 1
}];
*/

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

authentication.init(app);

var isAuthenticated = function (req, res, next) {
  authentication.isAuthenticated(req, res, next);
}

app.set('view engine','ejs');
app.get('/favicon.ico', function(req, res,next) {
    res.sendStatus(204);
});
app.post('/login',
    authentication.authenticate()
);
app.get('/login',function(req,res,next){
    res.render("login");
});

app.get('/addUser',isAuthenticated,
    function(req,res,next){
        if(req.query.username && req.query.password ){
            authentication.addUser(req.query.username,req.query.password);
            res.render("login");
        }
        res.status(404).send(err);
    }
);

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

/*
//useful for debugging forked processes
(function() {
    var childProcess = require("child_process");
    var oldfork = childProcess.fork;
    function myfork() {
        console.log('fork called');
        console.log(arguments);
        var result = oldfork.apply(this, arguments);
        return result;
    }
    childProcess.fork = myfork;
})();
*/