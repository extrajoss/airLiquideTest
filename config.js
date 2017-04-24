var config = {};

config.jolecule = {};
config.web = {};

config.web.port = process.env.WEB_PORT || 8064;    
config.web.baseStatic = __dirname + '/public';
config.web.proteinListGoogleSpreadsheet = "https://docs.google.com/spreadsheets/d/1o86skn1Aycf4wNdo00FVSlK5xEX1V8WugkSrpPrmIH0/edit?ts=58e3a5de#gid=448796123";
config.web.helpGoogleDocument = "https://docs.google.com/document/d/1jLpzLvHNIwmnzuLMfgerGgbYSdKGLez2ivL3ViTULss/pub";
config.web.MAX_CACHE_SIZE = 300000;

config.jolecule.SPACIAL_CUTOFF = 2;
config.jolecule.MAP_FILE_PATH = "http://hpc.csiro.au/users/272675/airliquide/mapfiles";
//config.jolecule.MAP_SHARED_FILE_PATH = "/Users/jos031/Code/Repos/airLiquideTest/public/test_data";
config.jolecule.PDB_FILE_PATH = "http://files.rcsb.org/pub/pdb/data/structures/divided/pdb";
config.jolecule.PREPROCESSING_SCRIPT = __dirname + '/resources/jolecule/autodock2pdbES5.js';
config.jolecule.JOL_STATIC_SCRIPT ='resources/jolecule/jol-static.js';
config.jolecule.NOBLE_GAS_SYMBOLS = 
                    ["He","Ne","Ar","Kr","Xe"];
config.jolecule.ENERGY_CUTOFF_SETS = {        
    "high":         [-0.4,-0.4,-0.9,-0.9,-1.3],
    "medium":       [-0.3,-0.3,-0.8,-0.8,-1.2],
    "low":          [-0.3,-0.3,-0.6,-0.6,-0.8],
    "-0.5":         [-0.5,-0.5,-0.5,-0.5,-0.5],
    "-0.6":         [-0.6,-0.6,-0.6,-0.6,-0.6],
    "veryHigh":     [-0.6,-0.6,-1.2,-1.2,-1.5],
}

module.exports = config;