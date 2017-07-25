

define(function() {

var result = {
  get_protein_data: function(loadProteinData) {
    loadProteinData({
      pdb_id: "1a0a.Ne",
      pdb_text: getPdbLines(),
    });
  },
  get_views: function(loadViewDicts) {
    loadViewDicts(getViewDicts());
  },
  save_views: function(views, success) {},
  delete_protein_view: function(viewId, success) {},
};
  
function getPdbLines() {
    return pdbLines.join('\n');
}  

function getViewDicts() {
    return views;
}  

var views = {};

var pdbLines = [
    "HETATM    0 Ne   XXX     0      19.907  28.285  29.094  1.00  0.41          Ne", 
    "HETATM    1 Ne   XXX     1      19.907  28.285  30.219  1.00  0.40          Ne", 
    "HETATM    2 Ne   XXX     2      21.032  28.285  30.219  1.00  0.41          Ne", 
    "HETATM    3 Ne   XXX     3      18.782  29.410  30.219  1.00  0.40          Ne", 
    "HETATM    4 Ne   XXX     4      19.907  29.410  30.219  1.00  0.43          Ne", 
    "HETATM    5 Ne   XXX     5      14.282  29.410  35.844  1.00  0.41          Ne", 
    "HETATM    6 Ne   XXX     6      17.657  29.410  35.844  1.00  0.40          Ne", 
    "HETATM    7 Ne   XXX     7      13.157  29.410  36.969  1.00  0.40          Ne", 
    "HETATM    8 Ne   XXX     8      23.282  22.660  38.094  1.00  0.40          Ne", 
    "HETATM    9 Ne   XXX     9      18.782  33.910  38.094  1.00  0.43          Ne", 
    "HETATM   10 Ne   XXX    10      19.907  33.910  38.094  1.00  0.41          Ne", 
    "HETATM   11 Ne   XXX    11      18.782  33.910  39.219  1.00  0.41          Ne", 
    "HETATM   12 Ne   XXX    12      19.907  33.910  39.219  1.00  0.41          Ne", 
    "HETATM   13 Ne   XXX    13      21.032  35.035  39.219  1.00  0.41          Ne", 
    "HETATM   14 Ne   XXX    14      15.407  30.535  47.094  1.00  0.44          Ne", 
    "", 
];

return result;
    
});

