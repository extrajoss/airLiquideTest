
module.exports = {
  ensureJoleculeIndex: function(pdbId){return joleculeHelpers(pdbId).ensureJoleculeIndex();}
}

let joleculeHelpers = function(pdbId){

    let childProcess = require("child_process");
    let path = require('path');
    let fs = require('fs');
    let request = require('request');
    let exports = {};
    const ENERGY_CUTOFF = -0.6;
    const SPACIAL_CUTOFF = 2;

    let pdbName = pdbId;

    const MAP_FILE_PATH = "http://hpc.csiro.au/users/272675/airliquide/mapfiles/";
    const PDB_FILE_PATH = "https://files.rcsb.org/view/";
    const NOBLE_GAS_SYMBOLS = ["Ar","He","Kr","Ne","Xe"];

    exports.ensureJoleculeIndex = function(){
            return ensureLocalFiles()
            .then(ensureJoleculePreProcessing)
            .then(ensureJoleculeStatic)
            .catch(function(err){throw(err)});
    };

    let ensureLocalFiles = function(){
        let localFiles = getMapFiles();
        localFiles.push(getPdbFile());
        return Promise
            .all(localFiles);
    }

    let getMapFiles = function(){
        return NOBLE_GAS_SYMBOLS.map(getMapFile);
    };

    let getMapFile = function(nobleGas) {
        let fileName = pdbName + '.' +nobleGas+ '.map';
        let remoteFilePath = MAP_FILE_PATH + pdbName + '/'+ fileName;
        let localFilePath = './public/maps/' +pdbName + '/'+ fileName;   
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath)
    };

    let getPdbFile = function (){
        let fileName = pdbName + '.pdb';
        let remoteFilePath = PDB_FILE_PATH + fileName;
        let localFilePath = './public/maps/' +pdbName+ '/'+ fileName;
        return ensureFileWithRemoteFile(localFilePath,remoteFilePath);
    };

    let getRemoteFile = function(localFilePath,remoteFilePath){
        return new Promise((resolve,reject)=>{
            let remoteFileStream = request(remoteFilePath).pipe(fs.createWriteStream( localFilePath));
            remoteFileStream.on('finish',resolve);
            remoteFileStream.on('error',reject);
        });
    }

    let ensureFileWithRemoteFile = function (localFilePath,remoteFilePath){
        return new Promise(function(resolve,reject){
            if (fs.existsSync(localFilePath)){
                console.log(localFilePath+" already exists locally");
                resolve(localFilePath);
            }else{
                let localFileDir = path.dirname(localFilePath);
                ensureDirectorySync(localFileDir);   
                getRemoteFile(localFilePath,remoteFilePath) 
                    .then(function(){
                        if (fs.existsSync(localFilePath)){
                            console.log(localFilePath+" created from "+remoteFilePath);
                            resolve(localFilePath);
                        }else{
                            reject("failed to create "+ localFilePath + " from "+ remoteFilePath);
                        }
                    });
            }
        });    
    };

    let ensureDirectorySync = function (directory) {  
        try {
            fs.statSync(directory);
        } catch(e) {
            fs.mkdirSync(directory);
        }
    };

    let checkDirectorySync = function (directory) {  
        try {
            fs.statSync(directory);
            return true;
        } catch(e) {
            return false;
        }
    };
    

    let checkJoleculePreProcessingFiles = function(){
        let fileChecks = NOBLE_GAS_SYMBOLS.map(checkJoleculePreProcessingFile);
        for (let i = 0; i < fileChecks.length; i++) {
            if(!fileChecks[i]){
                return false;
            }       
        }
        return true;
    };

    let checkJoleculePreProcessingFile = function(nobleGas) {
        let fileName = pdbName + '.' +nobleGas+ '.pdb';
        let localFilePath = './public/maps/' +pdbName + '/'+ fileName;  
        return fs.existsSync(localFilePath);
    };

    let ensureJoleculePreProcessing = function(){
        return new Promise(function(resolve,reject){
            if(checkJoleculePreProcessingFiles()){
                console.log("PreProcessing Files Found");
                return resolve();
            }else{
                console.log("PreProcessing Files Not Found");
                runJoleculePreProcessing()
                    .then(function(){
                        if(checkJoleculePreProcessingFiles()){
                            console.log("PreProcessing Files Found");
                            return resolve();                        
                        }else{
                            return reject("PreProcessing succeeded but PreProcessingFiles not generated");
                        }
                    });
            }
        });
    };

    let runJoleculePreProcessing = function(){
        return runScriptAsync('../../../resources/jolecule/autodock2pdb.js',[ "-u", ENERGY_CUTOFF,"-s", SPACIAL_CUTOFF, pdbName],{cwd:"./public/maps/"+pdbName});
    };

    let checkJoleculeStaticFile = function(){
        let localFilePath = './public/maps/' +pdbName + '/' +pdbName + '-jol/index.html';  
        return fs.existsSync(localFilePath);
    };

    let promiseJoleculeStaticFile = function(){
        return new Promise(
            function(resolve,reject){
                if(checkJoleculeStaticFile()){
                    console.log("Static files found");
                        return resolve();
                    }else{
                        return reject("Static succeeded but Static File not generated");
                    }
                }
            )
        };

    let ensureJoleculeStatic = function(){
        return new Promise(function(resolve,reject){
            console.log("Checking for Static files");
            if(checkJoleculeStaticFile()){
                console.log("Static files found");
                return resolve();
            }else{
                console.log("Static files not found");
                runJoleculeStatic()
                    .then(function(){
                            if(checkJoleculeStaticFile()){
                                console.log("Static files found");
                                return resolve();
                            }else{
                                return reject("Static succeeded but Static File not generated");
                            }
                    });
            }
        });
    };

    let runJoleculeStatic = function (){
        console.log("Run jol-static");

        let scriptArguments = [];
        scriptArguments.push(pdbName+".pdb");
        scriptArguments = scriptArguments.concat(NOBLE_GAS_SYMBOLS.map(function(nobleGas){return pdbName+"."+nobleGas+".pdb"}));
        return  runScriptAsync('../../../resources/jolecule/jol-static.js',scriptArguments,{cwd:"./public/maps/"+pdbName});
    };

    let runScriptAsync = function (scriptPath,args,options){
        return new Promise(function(resolve,reject){
            runScript(scriptPath,args,options, resolve,reject);
        });
    };

    let runScript = function (scriptPath,args,options, success, fail) {

        // keep track of whether callback has been invoked to prevent multiple invocations
        let invoked = false;

        let process = childProcess.fork(scriptPath,args,options);

        // listen for errors as they may prevent the exit event from firing
        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;
            console.log(scriptPath ,args,options, "Failed" , err);
            fail(err);
        });

        // execute the callback once the process has finished running
        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            let err = code === 0 ? null : new Error('exit code ' + code);
            if(err){
                console.log(scriptPath + " Failed:" +err);
                fail(err);
            }else{
                console.log(scriptPath ,args,options, "Succeeded");
                success();
            }
        });

    };
    
    return exports;
    
}