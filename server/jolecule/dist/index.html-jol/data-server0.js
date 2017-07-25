

define(function() {

var result = {
  get_protein_data: function(loadProteinData) {
    loadProteinData({
      pdb_id: "index.html",
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
    "", 
    "<html>", 
    "", 
    "<head>", 
    "  <meta name=\"mobile-web-app-capable\" content=\"yes\"/> ", 
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0\"/>", 
    "  <link rel=\"stylesheet\" type=\"text/css\" href=\"full-page-jolecule.css\" />", 
    "  <link rel=\"stylesheet\" type=\"text/css\" href=\"jolecule.css\"/>", 
    "  <title>jolecule</title>", 
    "</head>", 
    "", 
    "<body>", 
    "  <div id=\"jolecule-container\">", 
    "    <div id=\"jolecule-body\">", 
    "      <div id=\"jolecule-sequence-container\"></div>", 
    "      <div id=\"jolecule-protein-container\"></div>", 
    "      <div id=\"jolecule-views-container\"></div>", 
    "      <script src=\"require.js\"></script>", 
    "      <script>", 
    "        (function() {", 
    "          require(['jolecule'], function(jolecule) {", 
    "            window.user = 'anonymous';", 
    "            var j = jolecule.initFullPageJolecule(", 
    "              '#jolecule-protein-container',", 
    "              '#jolecule-sequence-container',", 
    "              '#jolecule-views-container',", 
    "              { isEditable: false });", 
    "            require([\"data-server0\", \"data-server1\", \"data-server2\", \"data-server3\", \"data-server4\", \"data-server5\"], function(dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5) {", 
    "              var dataServers = [dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5];", 
    "              for (var dataServer of dataServers) {", 
    "                j.addDataServer(dataServer);", 
    "              }", 
    "            });", 
    "          });", 
    "        })();", 
    "      </script>", 
    "    </div>", 
    "  </div>", 
    "</body>", 
    "", 
    "</html>", 
    "", 
];

return result;
    
});

