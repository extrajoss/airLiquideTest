var joleculeHelpers = require('./joleculeHelpers.js');
var processingCache = {};

var getEnsureJoleculeIndex = function(jol){
    if(processingCache[jol.pdb]){
        console.log("Retreiving Promise from cache");
    }else{
        console.log("Assigning Promise to cache");
        processingCache[jol.pdb] = jol.ensureJoleculeIndex();
    }
    return processingCache[jol.pdb];
};

var isPdb = function(pdb){
    return pdb.match(/^\w{4}$/);
};

var checkFilesAndReturnJSON = function(req, res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var jol = joleculeHelpers.set(pdb,energyCutoffSet);

    if(isPdb(pdb)){
        getEnsureJoleculeIndex(jol)
            .then(function(){
                delete(processingCache[pdb]);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({pdb:pdb,energyCutoffSet:energyCutoffSet,dataServerLocalPath:jol.paths.dataServerLocalPathClient}));
            })
            .catch(function(err){
                delete(processingCache[pdb]);
                console.error("An Error occured during file preparation: " + err);
                res.send('{"ErrorText": "'+err+'"}');
            });       
    }else{
        err = "'"+pdb+"' is not a valid PDB record";
        console.error(err);
        res.send('{"ErrorText": "'+err+'"}');
    }
};

module.exports = {
  "checkFilesAndReturnJSON": checkFilesAndReturnJSON
}
