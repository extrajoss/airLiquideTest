

define(function() {

var result = {
  get_protein_data: function(loadProteinData) {
    loadProteinData({
      pdb_id: "1a0a.He",
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
    "HETATM    0 He   XXX     0      16.532  30.535  48.219  1.00  0.40          He", 
    "", 
];

return result;
    
});

