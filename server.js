var express = require('express');
var app = express();
var port = process.env.PORT || 8064;
var ecache  = require('./server/ensureProcessingCache.js');

app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');
//app.engine('html', require('ejs').renderFile);

app.get('/',function(req,res){
  res.sendFile(__dirname + "/index.html");
});

app.get(
    '/getMaps/:pdb/',
    function(req, res, next){        
        ecache.checkFilesAndReturnJSON(req,res);
    });

app.get(
    '/maps/:pdb/',
    function(req, res, next){
        res.render("jolecule",{pdb:req.params.pdb});
    });

var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" listening on port: ' + port)
});

