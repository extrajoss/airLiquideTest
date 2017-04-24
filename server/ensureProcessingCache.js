var joleculeHelpers = require('./joleculeHelpers.js');
var config = require('../config');
var sizeof = require('object-sizeof');
var fs = require('fs-extra');
var dataServersCaches = {};
var dataServerCacheIdToRemove;


var flushCache = function(req,res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var cacheId = pdb+"_"+energyCutoffSet;
    delete(dataServersCaches[cacheId]);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({"flushedCashId": cacheId}));
};

var retrieveCache = function(req,res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var index = req.params.index;
    var cacheId = pdb + "_" + energyCutoffSet;
    return dataServersCaches[cacheId].dataServers
        .then(function(dataServers){
            return dataServers[index];
        });
};

var checkFilesAndReturnJSON = function(req, res){
    var pdb = req.params.pdb;
    var energyCutoffSet = req.params.energyCutoffSet;
    var jol = joleculeHelpers.set(pdb,energyCutoffSet);
    var cacheId = jol.pdb + "_" + jol.energyCutoffSet;

    var isPdb = function(){
        return pdb.match(/^\w{4}$/)?true:false;
    };

    var isEnergyCutoffSet = function(){
            return Object.keys(jol.ENERGY_CUTOFF_SETS).indexOf(energyCutoffSet)>=0;
    };

    var trimCache = function(){
        if(sizeof(dataServersCaches)>config.web.MAX_CACHE_SIZE){
            console.log("Removing "+dataServerCacheIdToRemove+ " from cache as cache ["+sizeof(dataServersCaches)+"] has exceeded maximum size of: "+ config.web.MAX_CACHE_SIZE);
            removeLeastAccessedOldestFromCache();
            trimCache();
        }else{
            console.log(sizeof(dataServersCaches)+" of "+config.web.MAX_CACHE_SIZE+" cache used.")
        }
    };

    var removeLeastAccessedOldestFromCache = function(){
        delete dataServersCaches[dataServerCacheIdToRemove];
        removeLocalFiles(dataServerCacheIdToRemove);
        var oldestCacheDate = Date.now();
        var smallestAccessCount;
        for (var cacheId in dataServersCaches) {
            var dataServersCache = dataServersCaches[cacheId];
            if(dataServersCache.accessCount <= smallestAccessCount || !smallestAccessCount){
                smallestAccessCount = dataServersCache.accessCount;
                if(dataServersCache.cacheDate <= oldestCacheDate){
                    dataServerCacheIdToRemove = cacheId;
                    oldestCacheDate = dataServersCache.cacheDate;
                }
            }
        };
    }

    var removeLocalFiles = function(cacheId){
        var args = cacheId.split("_");
        if (args.length!=2){
            throw("Error removing local files, could not read arguments from " + cacheId);
        }
        var jol = joleculeHelpers.set(args[0],args[1]);
        var pathToRemove = jol.paths.baseLocalPath;
        console.log("Removing local files at "+ pathToRemove);
        fs.remove(pathToRemove);
    }

    var getDataServersFromCache = function(jol){        
        if(dataServersCaches[cacheId]){
            dataServersCaches[cacheId].accessCount +=1;
            dataServersCaches[cacheId].accessDate = new Date();
            console.log("Retreived "+cacheId+" from cache.\n  Accesses: " + dataServersCaches[cacheId].accessCount + ",\n  First Accessed: " +dataServersCaches[cacheId].cacheDate.toString()+ ",\n  Last Accessed: " +dataServersCaches[cacheId].accessDate.toString());
        }else{            
            var cacheDate = new Date();
            if (!dataServerCacheIdToRemove){
                dataServerCacheIdToRemove = cacheId;
            }
            dataServersCaches[cacheId] = {"cacheDate": cacheDate,"accessDate": cacheDate, "accessCount":1,"dataServers":jol.ensureJoleculeDataServers()};
            console.log("Assigned "+cacheId+" to cache.\n  Accesses: " + dataServersCaches[cacheId].accessCount + ",\n  First Accessed: " +dataServersCaches[cacheId].cacheDate.toString()+ ",\n  Last Accessed: " +dataServersCaches[cacheId].accessDate.toString());
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
            res.send(JSON.stringify({pdb:pdb,cutoff:energyCutoffSet,dataServerRoute:jol.paths.dataServerRoute}));
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
