var express = require('express');
var app = express();
var joleculeHelpers = require('./server/joleculeHelpers.js');

var port = process.env.PORT || 8888;
app.use(express.static(__dirname + '/public'));

const PDB_NAME = "1be9";

var args = process.argv.slice(2);
var pdbName = PDB_NAME;

if(args[0]){
    pdbName = args[0] ;
}

joleculeHelpers.ensureJoleculeIndex(pdbName);