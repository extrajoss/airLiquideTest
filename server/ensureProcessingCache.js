var joleculeHelpers = require('./joleculeHelpers.js');
var processingCache = {};

var checkFilesAndReturnJSON = function(req, res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var jol = joleculeHelpers.set(pdb,energyCutoffSet);
    var cacheId = jol.pdb+jol.energyCutoffSet;

    var isPdb = function(){
        return pdb.match(/^\w{4}$/)?true:false;
    };

    var isEnergyCutoffSet = function(){
            return Object.keys(jol.ENERGY_CUTOFF_SETS).indexOf(energyCutoffSet)>=0;
    };

    var getEnsureJoleculeIndex = function(jol){        
        if(processingCache[cacheId]){
            console.log("Retreiving Promise from cache");
        }else{
            console.log("Assigning Promise to cache");
            processingCache[cacheId] = jol.ensureJoleculeIndex();
        }
        return processingCache[cacheId];
    };
    
    if(!isPdb()){
        err = "'"+pdb+"' is not a valid PDB record";
        console.error(err);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ErrorText: err}));
        return;
    }
    if(!isEnergyCutoffSet()){
        err = "'" + energyCutoffSet +"' is not a valid energyCutoffSet. (Try: " + Object.keys(jol.ENERGY_CUTOFF_SETS).join(",") + ")";
        console.error(err);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ErrorText: err}));
        return;
    }
    getEnsureJoleculeIndex(jol)
        .then(function(){
            delete(processingCache[cacheId]);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({pdb:pdb,energyCutoffSet:energyCutoffSet,dataServerLocalPath:jol.paths.dataServerLocalPathClient}));
        })
        .catch(function(err){
            delete(processingCache[cacheId]);
            console.error("An Error occured during file preparation: " + err);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ErrorText: err}));
        }); 
};

module.exports = {
  "checkFilesAndReturnJSON": checkFilesAndReturnJSON
}
