var express = require('express');
var config = require('./config');
var ecache  = require('./server/ensureProcessingCache.js');

var app = express();
var port = config.web.port;
var baseStatic = config.web.baseStatic;

app.use(express.static(baseStatic));
app.set('view engine','ejs');

app.get('/',
    function(req,res){
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
    '/:pdb/',
    function(req,res){
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
    '/getMaps/:pdb/:energyCutoffSet/',
    function(req, res, next){        
        ecache.checkFilesAndReturnJSON(req,res);
    });   

app.get(
    '/flushCache/:pdb/:energyCutoffSet/',
    function(req, res, next){
        ecache.flushCache(req,res);
    });

app.get(
    '/data/:pdb/:energyCutoffSet/:index/',
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
   res.redirect('/');
}) 

var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port);
});

