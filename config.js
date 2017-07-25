var config = {};

config.jolecule = {};
config.aquaria = {};
config.web = {};

config.web.port = process.env.WEB_PORT || 8064;  
config.web.baseWebsite = 'http://group18.csiro.au';  
config.web.baseStatic = __dirname + '/public';
config.web.proteinListGoogleSpreadsheet = {
    "He":{
        elementName:"Helium",
        atomicNumber:"2",
        atomicWeight:"4.003",
        withLigand:{
            "high":"https://drive.google.com/open?id=1DjmSc7hcU_NUspzmpL5na9xlCoTMZRj6F8HrE_luOvI",
            "medium":"https://drive.google.com/open?id=1_KsJ8uULHAiE3hWbb1A1LqjYefPejRzh4iC697a3G2U",
            "low":"https://drive.google.com/open?id=1862x7bMgj75WQJdvAKdKTmmnL-wYfuoalg2UrgLXLT0"
        },
        withoutLigand:{
            "high":"https://drive.google.com/open?id=1vkhL_rmznrwjhTFS8yDtHxr83DBN4sIwvZxfufE5jto",
            "medium":"https://drive.google.com/open?id=18HoeHpD8G2Nr-vMjNCbYjhU4qGGmu14UpfuLog5FeBM",
            "low":"https://drive.google.com/open?id=1kHuaTUjRIcEHsFomr1r7VjEL3mamV13pUPKp8HLQSSA"
        }
    },
    "Ne":{
        elementName:"Neon",
        atomicNumber:"10",
        atomicWeight:"28.180",
        withLigand:{
            "high":"https://drive.google.com/open?id=1CJ6hPp24L2UXzYL8d7E5-loBaeMU0-hY_HdmA1k60Mc",
            "medium":"https://drive.google.com/open?id=1OcycyEPE_aug0Ee7__vkstc6OATZ8fVpRU_NamnREDs",
            "low":"https://drive.google.com/open?id=1yqHPRpKquwNai9Q9GO-_OJLp75lcbMNA8jXYRWVRd_0"
        },
        withoutLigand:{
            "high":"https://drive.google.com/open?id=1JvYmdQg7Y7nV83iGGkCtexO9LsK5U5R06Opz7hfOjbk",
            "medium":"https://drive.google.com/open?id=12eOCk95iFcoWm570DkcQMGW9rZi56z8kyVjyWCuEuEs",
            "low":"https://drive.google.com/open?id=1QWRgOUy1aISvBRmpGBYnYlgtLEIb9OTKI--OizIDT84"
        }
    },
    "Ar":{
        elementName:"Argon",
        atomicNumber:"18",
        atomicWeight:"39.948",
        withLigand:{
            "high":"https://drive.google.com/open?id=1EDifQLe6Abq2Y9QawFXLoGJoUBHusvSXGjJXFagN2us",
            "medium":"https://drive.google.com/open?id=1x_M3Bd1Xjsxfhw0TwSSOLfrMBtHuar96a8dRejlRe1E",
            "low":"https://drive.google.com/open?id=19W7rN6VXsKEM79zsApg5U5gImBa2a4cmRZ5LcV08GFs"
        },
        withoutLigand:{
            "high":"https://drive.google.com/open?id=1tRx-3U0kJOBH0ikpiYQyhz3TNljcvATfOqYoIADvAhk",
            "medium":"https://drive.google.com/open?id=1ozHhAJVnObrBuaoilZVfMgCtuFrBD0kaZaxRm5xp2bM",
            "low":"https://drive.google.com/open?id=1mOOOG5M2pCZBN7syryGibaNv0I4T6w7bWC8PhXjJoJg"
        }
    },
    "Kr":{
        elementName:"Krypton",
        atomicNumber:"36",
        atomicWeight:"84.80",
        withLigand:{
            "high":"https://drive.google.com/open?id=18qyU7zoDVqAVNNnFlagyNMLMsy0sX8iZtXCvqdTxzyk",
            "medium":"https://drive.google.com/open?id=1flAMUVIhgRdaKZ89c-xnLEmrxkf_hRAjbcJn43--O64",
            "low":"https://drive.google.com/open?id=1wjuA8Bgj12jgGU1xjdScrqUfNUNeQpRNRSVLLBkfSVE"
        },
        withoutLigand:{
            "high":"https://drive.google.com/open?id=1QbSMxgQlnmppymjr2S9CbQ_yXLTAnVYzR5Js5lxJ_nw",
            "medium":"https://drive.google.com/open?id=1uTXqGw6rFiRnzUELzPOOywiGeNegn2OMo4HkMXbCriQ",
            "low":"https://drive.google.com/open?id=1JEkO9fKCidJnAiPz93v-J7MfwUtbSh4CGvpFDkLi9O0"
        }
    },
    "Xe":{
        elementName:"Xenon",
        atomicNumber:"54",
        atomicWeight:"131.29",
        withLigand:{
            "high":"https://drive.google.com/open?id=1E3GwjzKbin2jZoGAmlCX1auU1b69YPYJ-kLuEtXX4uk",
            "medium":"https://drive.google.com/open?id=1q8Fi4Z3jPqbNfBYIHKuU_7euuCwxkjngXEWpL9NqcW4",
            "low":"https://drive.google.com/open?id=1eCaYFBLsvuGz-7pURe5YDEEan_r1_w1jd_csO-KMXEQ"
        },
        withoutLigand:{
            "high":"https://drive.google.com/open?id=1oQxQbjQvi-c_F-J_9tgwNSxz3Q1M_31vuZ77jCa2r18",
            "medium":"https://drive.google.com/open?id=1rZBundXMhF4TCeMmll675IPXmeaM5Iuqz6MwpHIfnnk",
            "low":"https://drive.google.com/open?id=1fdP2_cR_7x69caXajc4Tfv2zY3Xcf8K9yz1v1EmxG9I"
        }
    }
};
config.web.helpGoogleDocument = "https://docs.google.com/document/d/1jLpzLvHNIwmnzuLMfgerGgbYSdKGLez2ivL3ViTULss/pub";
config.web.MAX_CACHE_SIZE = 500000;

config.jolecule.SPACIAL_CUTOFF = 2;
config.jolecule.MAP_FILE_PATH = "http://hpc.csiro.au/users/272675/airliquide/mapfiles";
//config.jolecule.MAP_SHARED_FILE_PATH = "//OSM/CBR/MFG_AIRLIQUIDE/work/web/mapfiles";
config.jolecule.PDB_FILE_PATH = "http://files.rcsb.org/pub/pdb/data/structures/divided/pdb";
config.jolecule.PREPROCESSING_SCRIPT = __dirname + '/server/jolecule/autodock2pdbES5.js';
config.jolecule.JOL_STATIC_SCRIPT ='server/jolecule/jol-static.js';
config.jolecule.NOBLE_GAS_SYMBOLS = 
                    ["He","Ne","Ar","Kr","Xe"];
config.jolecule.ENERGY_CUTOFF_SETS = {        
    "high":         [-0.4,-0.4,-0.9,-0.9,-1.3],
    "medium":       [-0.3,-0.3,-0.8,-0.8,-1.2],
    "low":          [-0.3,-0.3,-0.6,-0.6,-0.8],
    "veryHigh":     [-0.6,-0.6,-1.2,-1.2,-1.5],
}
config.jolecule.MAX_ENERGY_CUTOFF = -0.5;
config.jolecule.MIN_ENERGY_CUTOFF = -2.0;

config.aquaria.UNIPROT_FILE_PATH = "http://aquaria.ws";

module.exports = config;