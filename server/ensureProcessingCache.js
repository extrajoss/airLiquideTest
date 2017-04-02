var joleculeHelpers = require('./joleculeHelpers.js');
var processingCache = {};

var getEnsureJoleculeIndex = function(pdb){
    if(processingCache[pdb]){
        console.log("Retreiving Promise from cache");
    }else{
        console.log("Assigning Promise to cache");
        processingCache.pdb = joleculeHelpers.ensureJoleculeIndex(pdb);
    }
    return processingCache.pdb;
};

var isPdb = function(pdb){
    return pdb.match(/^\w{4}$/);
};

var returnJSON = function(res,pdb){
    res.setHeader('Content-Type', 'application/json');
    res.send('{"pdb": "'+pdb+'"}');
};

var returnPage =function(res, pdb){
    var fileToRedirect = '/maps/' + pdb + '/' + pdb + '-jol/index.html';
    console.log("Redirecting to: " + fileToRedirect);
    res.redirect(fileToRedirect);
};

var checkFilesAndReturn = function(req, res, view){
    var pdb = req.params.pdb;
    if(isPdb(pdb)){
        console.log("start building promise");
        getEnsureJoleculeIndex(pdb)
            .then(function(){
                delete(processingCache.pdb);
                res.render(view,{pdb:pdb});
            })
            .catch(function(err){
                delete(processingCache.pdb);
                console.error("An Error occured during file preparation: " + err);
                res.send('{"ErrorText": "'+err+'"}');
            });   
            console.log("finished building promise");     
    }else{
        err = "'"+pdb+"' is not a valid PDB record";
        console.error(err);
        res.send('{"ErrorText": "'+err+'"}');
    }
};

var checkFilesAndReturnJSON = function(req, res){
    checkFilesAndReturn(req, res, "pdbJson");
};

var checkFilesAndReturnPage = function(req, res){
    checkFilesAndReturn(req, res, "jolecule");
};

module.exports = {
  "checkFilesAndReturnJSON": checkFilesAndReturnJSON,
  "checkFilesAndReturnPage": checkFilesAndReturnPage
}
