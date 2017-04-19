var joleculeHelpers = require('./joleculeHelpers.js');
var config = require('../config');
var sizeof = require('object-sizeof');
var dataServersCaches = {};
var oldestDataServerCacheId;


var flushCache = function(req,res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var cacheId = pdb+"_"+energyCutoffSet;
    delete(dataServersCaches[cacheId]);
};

var retrieveCache = function(req,res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var index = req.params.index;
    var cacheId = pdb+"_"+energyCutoffSet;
    return dataServersCaches[cacheId].dataServers
        .then(function(dataServers){
            return dataServers[index];
        });
};

var checkFilesAndReturnJSON = function(req, res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var jol = joleculeHelpers.set(pdb,energyCutoffSet);
    var cacheId = jol.pdb+"_"+jol.energyCutoffSet;

    var isPdb = function(){
        return pdb.match(/^\w{4}$/)?true:false;
    };

    var isEnergyCutoffSet = function(){
            return Object.keys(jol.ENERGY_CUTOFF_SETS).indexOf(energyCutoffSet)>=0;
    };

    var trimCache = function(){
        if(sizeof(dataServersCaches)>config.web.MAX_CACHE_SIZE){
            console.log("Removing "+oldestDataServerCacheId+ " from cache as cache ["+sizeof(dataServersCaches)+"] has exceeded maximum size of: "+ MAX_CACHE_SIZE);
            removeOldestFromCache();
            trimCache();
        }else{
            console.log(sizeof(dataServersCaches)+" of "+config.web.MAX_CACHE_SIZE+" cache used.")
        }
    };

    var removeOldestFromCache = function(){
        delete dataServersCaches[oldestDataServerCacheId];
        var oldestCacheDate = Date.now();
        for (var cacheId in dataServersCaches) {
            var dataServersCache = dataServersCaches[cacheId];
            if(dataServersCache.cacheDate <= oldestCacheDate){
                oldestDataServerCacheId = cacheId;
                oldestCacheDate = dataServersCache.cacheDate;
            }
        };
    }

    var getDataServersFromCache = function(jol){        
        if(dataServersCaches[cacheId]){
            console.log("Retreiving "+cacheId+" from cache");
        }else{
            console.log("Assigning "+cacheId+" to cache");
            var cacheDate = Date.now();
            if (!oldestDataServerCacheId){
                oldestDataServerCacheId = cacheId;
            }
            dataServersCaches[cacheId] = {"cacheDate": cacheDate, "dataServers":jol.ensureJoleculeDataServers()};
        }
        trimCache();
        return dataServersCaches[cacheId].dataServers;
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
    getDataServersFromCache(jol)
        .then(function(dataServers){
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({pdb:pdb,energyCutoffSet:energyCutoffSet,dataServerLocalPath:jol.paths.dataServerRoute}));
        })
        .catch(function(err){
            console.error("An Error occured during file preparation: " + err);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ErrorText: err}));
        }); 
};

module.exports = {
  "checkFilesAndReturnJSON": checkFilesAndReturnJSON,
  "flushCache": flushCache,
  "retrieveCache": retrieveCache
}
