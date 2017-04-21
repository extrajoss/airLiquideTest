var express = require('express');
var config = require('./config');
var ecache  = require('./server/ensureProcessingCache.js');

var app = express();
var port = config.web.port;
var baseStatic = config.web.baseStatic;

app.use(express.static(baseStatic));
app.set('view engine','ejs');

app.get('/',function(req,res){
  res.redirect(config.web.googleSpreadsheet);
});

app.get(
    '/pdb/:pdb/',
    function(req,res){
        var defaultEnergyCutoffSet = Object.keys(config.jolecule.ENERGY_CUTOFF_SETS)[0];
        res.redirect('/pdb/'+defaultEnergyCutoffSet+'/'+req.params.pdb);
    }
);

app.get(
    '/pdb/:energyCutoffSet/:pdb/',
    function(req,res){
        res.render(
            "jolecule",
            {
                pdb:req.params.pdb,
                energyCutoffSet:req.params.energyCutoffSet
            }
        ); 
    }
);

app.get(
    '/getMaps/:energyCutoffSet/:pdb/',
    function(req, res, next){        
        ecache.checkFilesAndReturnJSON(req,res);
    });   

app.get(
    '/flushCache/:energyCutoffSet/:pdb/',
    function(req, res, next){
        ecache.flushCache(req,res);
    });

app.get(
    '/data/:energyCutoffSet/:pdb/:index/',
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
  res.status(404).render("404");
}) 

var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port);
});

