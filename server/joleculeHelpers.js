
module.exports = {
  ensureJoleculeIndex: function(pdbId){return joleculeHelpers(pdbId).ensureJoleculeIndex();}
}

var joleculeHelpers = function(pdbId){

    var childProcess = require("child_process");
    var path = require('path');
    var fs = require('fs');
    var request = require('request');
    var exports = {};
    const ENERGY_CUTOFF = -0.5;
    const SPACIAL_CUTOFF = 2;

    var pdbName = pdbId;

    const MAP_FILE_PATH = "http://hpc.csiro.au/users/272675/airliquide/mapfiles/";
    const PDB_FILE_PATH = "https://files.rcsb.org/view/";
    const NOBLE_GAS_SYMBOLS = ["Ar","He","Kr","Ne","Xe"];

    exports.ensureJoleculeIndex = function(){
            return ensureLocalFiles()
            .then(ensureJoleculePreProcessing)
            .then(runJoleculeStatic);
    };

    var ensureLocalFiles = function(){
        var localFiles = getMapFiles();
        localFiles.push(getPdbFile());
        return Promise
            .all(localFiles);
    }

    var getMapFiles = function(){
        return NOBLE_GAS_SYMBOLS.map(getMapFile);
    };

    var getMapFile = function(nobleGas) {
        var fileName = pdbName + '.' +nobleGas+ '.map';
        var remoteFilePath = MAP_FILE_PATH + pdbName + '/'+ fileName;
        var localFilePath = './public/maps/' +pdbName + '/'+ fileName;   
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
    };

    var getPdbFile = function (){
        var fileName = pdbName + '.pdb';
        var remoteFilePath = PDB_FILE_PATH + fileName;
        var localFilePath = './public/maps/' +pdbName+ '/'+ fileName;
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath);
    };

    var ensureFileWithRemoteFile = function (localFilePath,remoteFilePath){
        return new Promise(function(resolve,reject){
            if (fs.existsSync(localFilePath)){
                console.log(localFilePath+" already exists locally");
                resolve(localFilePath);
            }else{
                var localFileDir = path.dirname(localFilePath);
                checkDirectorySync(localFileDir);    
                var remoteFileStream = request(remoteFilePath).pipe(fs.createWriteStream( localFilePath));
                remoteFileStream.on('finish',function(){
                    console.log(localFilePath+" created from "+remoteFilePath);
                    resolve(localFilePath);
                });
            }
        });    
    };

    var checkDirectorySync = function (directory) {  
        try {
            fs.statSync(directory);
        } catch(e) {
            fs.mkdirSync(directory);
        }
    };

    var checkJoleculePreProcessingFiles = function(){
        var fileChecks = NOBLE_GAS_SYMBOLS.map(checkJoleculePreProcessingFile);
        for (var i = 0; i < fileChecks.length; i++) {
            if(!fileChecks[i]){
                return false;
            }       
        }
        return true;
    };

    var checkJoleculePreProcessingFile = function(nobleGas) {
        var fileName = pdbName + '.' +nobleGas+ '.pdb';
        var localFilePath = './public/maps/' +pdbName + '/'+ fileName;  
        return fs.existsSync(localFilePath);
    };

    var ensureJoleculePreProcessing = function(){
        if(!checkJoleculePreProcessingFiles()){
            console.log("PreProcessing");
            return runJoleculePreProcessing();
        }else{
            console.log("PreProcessing Skipped");
            return Promise.resolve();
        }
    };

    var runJoleculePreProcessing = function(){
        return runScriptAsync('../../../resources/jolecule/autodock2pdb.js',[ "-u", ENERGY_CUTOFF,"-s", SPACIAL_CUTOFF, pdbName],{cwd:"./public/maps/"+pdbName}, function (err) {
            if (err) throw err;
        });
    };

    var checkJoleculeStaticFiles = function(){
        return [Promise.resolve()];
    };

    var ensureJoleculeStatic = function(){
        Promise.all(checkJoleculeStaticFiles)
            .then(function(){Promise.resolve();})
            .catch(runJoleculeStatic);
    };

    var runJoleculeStatic = function (){
        console.log("attempting to run jol-static");
        return  runScriptAsync('../../../resources/jolecule/jol-static.js',[pdbName+".pdb", pdbName+".Ar.pdb", pdbName+".He.pdb", pdbName+".Kr.pdb", pdbName+".Ne.pdb", pdbName+".Xe.pdb"],{cwd:"./public/maps/"+pdbName}, function (err) {
                if (err) throw err;
                console.log("jol-static run");
            });
    };

    var runScriptAsync = function (scriptPath,args,options){
        return new Promise(function(resolve,reject){
            runScript(scriptPath,args,options, resolve,reject);
        });
    };

    var runScript = function (scriptPath,args,options, success, fail) {

        // keep track of whether callback has been invoked to prevent multiple invocations
        var invoked = false;

        var process = childProcess.fork(scriptPath,args,options);

        // listen for errors as they may prevent the exit event from firing
        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;
            console.log(scriptPath + " Failed:" +err);
            fail(err);
        });

        // execute the callback once the process has finished running
        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            var err = code === 0 ? null : new Error('exit code ' + code);
            if(err){
                console.log(scriptPath + " Failed:" +err);
                fail(err);
            }else{
                console.log(scriptPath + " Succeeded");
                success();
            }
        });

    };
    
    return exports;
    
}