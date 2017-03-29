var express = require('express');
var app = express();
var joleculeHelpers = require('./server/joleculeHelpers.js');

var port = process.env.PORT || 8064;

app.use(express.static(__dirname + '/public'));
//app.set('view engine','ejs');
//app.engine('html', require('ejs').renderFile);
app.get('/',function(req,res){
  res.sendFile(__dirname + "/index.html");
});
app.get(
    '/maps/:pdb/',
    function(req, res,next){
        if(req.params.pdb.match(/^\w{4}$/)){
            joleculeHelpers.ensureJoleculeIndex(req.params.pdb)
                .then(next);               
        }else{
            res.send("Not a valid PDB record");
        }
    },
    function(req,res,next){
        var fileToRedirect = '/maps/' + req.params.pdb + '/' + req.params.pdb + '-jol/index.html';
        console.log("Redirecting to: " + fileToRedirect);
        res.redirect(fileToRedirect);
    }
);

var srv = app.listen(port, function(){
    console.log('"AirLiquideTest" is listening on port: ' + port)
});


