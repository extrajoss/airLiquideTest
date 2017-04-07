var loadingText = '<div style="display: inline-block">Checking file requirements.<br/>This may takes several minutes.</div> <div class="loader" style="display: inline-block"></div>';
var loadingDiv = $("<div></div>").attr('id', 'temploading-message').css({
    'z-index': 5000,
    'background-color': 'rgba(60, 60, 60, 0.75)',
    'font-family': 'Helvetica, Arial, sans-serif',
    'font-size': '12px',
    'letter-spacing': '0.1em',
    'padding': '5px', 
    'top':'90px',
    'left':'100px',
    'position':'absolute',
    'color': '#666' }).html(loadingText).resize();
var loadingDiv2 = $("<div></div>").attr('id', 'temploading-message').css({
    'z-index': 5000,
    'background-color': 'rgba(60, 60, 60, 0.75)',
    'font-family': 'Helvetica, Arial, sans-serif',
    'font-size': '12px',
    'letter-spacing': '0.1em',
    'padding': '5px', 
    'top':'190px',
    'left':'100px',
    'position':'absolute',
    'color': '#666' }).html(loadingText).resize();
var openMap = function (pdb,energyCutoffSet){    
    $("#tempLoading").show();
    $("#jolecule").hide();
    if(pdb.length!=4){
        $('#temploading-message').html("'" +pdb + "' is not a valid PDB. PDBs must be 4 characters long.");
        return;
    }
    $('#temploading-message').html(loadingText).resize();         
    $.getJSON({
        url: "/getMaps/"+pdb+"/"+energyCutoffSet+"/",
        success: displayJolecule
    })
    .fail(function(err) {
        $('#temploading-message').empty();
        $('#temploading-message').html(err.responseText).resize();   
        console.log('Error: ' ,err);
    })
    .always(function(err) {
        console.log("Loaded");
    });
};  
var displayJolecule = function(res) {    
    if(res.ErrorText){
        console.error(res.ErrorText);  
        $('#temploading-message').empty();
        $('#temploading-message').html(res.ErrorText).resize();                           
        return;
    }
    console.log("displayJolecule",res);
    var pdb = res.pdb;
    var energyCutoffSet = res.energyCutoffSet;  
    var dataServerLocalPath = res.dataServerLocalPath
    $("#tempLoading").hide();
    $("#jolecule").show();            
    require( 
            ['/scripts/jolecule.js', 
            dataServerLocalPath+"/data-server0.js", 
            dataServerLocalPath+"/data-server1.js", 
            dataServerLocalPath+"/data-server2.js", 
            dataServerLocalPath+"/data-server3.js", 
            dataServerLocalPath+"/data-server4.js", 
            dataServerLocalPath+"/data-server5.js"], 
            function(jolecule, dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5) {                  
        jolecule.initEmbedJolecule({
            div_tag: '#jolecule',
            data_servers: [dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5],
            isGrid: true,
            loading_html:"<div class='loader'>Loading....</div>",
        });
    });     
};