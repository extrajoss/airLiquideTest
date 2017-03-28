var express = require('express');
var app = express();
var joleculeHelpers = require('./server/joleculeHelpers.js');

var port = process.env.PORT || 8888;
app.use(express.static(__dirname + '/public'));

const PDB_NAME = "1be9";

var args = process.argv.slice(2);

var port = process.env.PORT || 8888;

app.engine('html', require('ejs').renderFile);
app.get('/maps/:pdb/', function(req, res,next){
    console.log("params:",req.params);
    if(req.params.pdb.match(/^\w{4}$/)){
        joleculeHelpers.ensureJoleculeIndex(req.params.pdb)
            .then(next);               
    }else{
        res.send("Not a valid PDB record");
    }
},function(req,res){
    var fileToRedirect = '/maps/' + req.params.pdb + '/' + req.params.pdb + '-jol/index.html';
    console.log(fileToRedirect);
    res.redirect(fileToRedirect);
    }
);

var srv = app.listen(port, function(){
    console.log('Michael is listening on port: ' + port)
});


