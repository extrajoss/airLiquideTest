var express = require('express');
var config = require('./config');
var ecache  = require('./server/ensureProcessingCache.js');

var app = express();
var port = config.web.port;
var baseStatic = config.web.baseStatic;

app.use(express.static(baseStatic));
app.set('view engine','ejs');
//app.engine('html', require('ejs').renderFile);

app.get('/',function(req,res){
  //res.sendFile(__dirname + "/index.html");
  res.redirect(config.web.googleSpreadsheet);
});

app.get(
    '/pdb/:pdb/',
    function(req,res){
        res.render(
            "jolecule",
            {
                pdb:req.params.pdb,
                energyCutoffSet:req.query.energyCutoffSet||Object.keys(config.jolecule.ENERGY_CUTOFF_SETS)[0]
            }
        ); 
    }
);

app.get(
    '/getMaps/:pdb/:energyCutoffSet/',
    function(req, res, next){        
        ecache.checkFilesAndReturnJSON(req,res);
    });   

app.use(function (req, res, next) {
  res.status(404).render("404");
}) 

var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port);
});

