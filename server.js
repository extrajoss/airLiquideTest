
const flash    = require('connect-flash');
const express = require('express');
const session = require('express-session') 
const config = require('./config');
const ecache  = require('./server/ensureProcessingCache.js');
const joleculeHelpers  = require('./server/joleculeHelpers.js');
const uniprotHelpers  = require('./server/uniprotHelpers.js');
const authentication = require('./server/authentication.js');

/*
const users = [{  
  fullname: 'AirLiquide',
  email: 'michael.joss@gmail.com',
  password: 'AirLiquide',
  id: 1
}];
*/

const AUTHENTICATION_EXCEPTIONS = [
    /^\/$/,
    /^\/(2bmm|1be9)\?cutoff=high$/,
    /^\/data\/(2bmm|1be9)\/high\/[0-5]\/$/,
    /^\/getMaps\/(2bmm|1be9)\/high\/$/
];

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
app.use(flash());

authentication.init(app);

var isAuthenticated = function (req, res, next) {
  if(isExceptedFromAuthentication(req)){
    delete req.session.returnTo;
    return next();
  } else{
    authentication.isAuthenticated(req, res, next);   
  }
}

var isExceptedFromAuthentication = function(req){
    let url = req.url;
    return AUTHENTICATION_EXCEPTIONS.some(
        (authentication_exception)=>{
        return authentication_exception.test(url);
        }
    );
}

app.set('view engine','ejs');
app.get('/favicon.ico', function(req, res,next) {
    res.sendStatus(204);
});
app.post('/login',
    function(res,req,next){
        return authentication.authenticate(res,req,next)(res,req,next);
    }
);
app.get('/login',function(req,res,next){
    let flash_message = req.flash('loginMessage');
    res.render("login", { message: flash_message });
});
app.post('/register',
    function(res,req,next){
        return authentication.register(res,req,next)(res,req,next);
    }
);
app.get('/register',function(req,res,next){
    let flash_message = req.flash('registerMessage');
    res.render("register", { message: flash_message });
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
app.get('/addUser',isAuthenticated,
    function(req,res,next){
        if(req.query.fullname && req.query.email &&req.query.password ){
            authentication.addUser(req.query.fullname,req.query.email,req.query.password);
            res.render("login");
        }
        res.status(404).send(err);
    }
);

app.get('/',isAuthenticated,
    async function(req,res,next){
        if(req.query.pdb && req.query.pdb.length == 4 ){
            res.redirect('/'+req.query.pdb+'?cutoff=high');
        }
        if(req.query.pdb2 && req.query.pdb2.length == 4 ){
            res.redirect('/'+req.query.pdb2+'?cutoff=high');
        }
        let user;
        if (req.session.passport && req.session.passport.user){
            user = await authentication.user_from_id(req.session.passport.user);
        }
        res.render(
            "overview",
            {
                proteinListGoogleSpreadsheet:config.web.proteinListGoogleSpreadsheet,
                baseWebsite:config.web.baseWebsite,
                defaultPDB:req.query.pdb,
                user: user
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
    '/getUniprot/:uniprot',isAuthenticated,
    async function(req, res, next){               
        let fileName = uniprotHelpers.getUniProtFile(req.params.uniprot);
        let csvResults = uniprotHelpers.parseCSV(await fileName);
        let fileNames = Promise.all(csvResults.mapFileChecks)
        csvResults.fileNames = await fileNames;
        for (var key in csvResults.fileNames) {
            csvResults.clusters[key].fileName = csvResults.fileNames[key];   
        }
        res.write(JSON.stringify(csvResults.clusters) );
        res.end();
    });   

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
    async function(req, res, next){     
        try{
            let dataServer = ecache.retrieveCache(req,res);  
            res.setHeader('content-type', 'text/javascript');
            res.write(await dataServer);
            res.end();
            
        }catch(err){
            res.status(404).send(err);
        }
    });   

app.use(function (req, res, next) {
   res.redirect('/login');
});


var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port);
});


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
