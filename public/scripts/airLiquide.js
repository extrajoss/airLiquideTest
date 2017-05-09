var loadingText = '<div style="display: inline-block">Checking file requirements.<br/>This may take several minutes.</div> <div class="loader" style="display: inline-block"></div>';
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
    var cutoff = res.cutoff;  
    var dataServerRoute = res.dataServerRoute
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?cutoff='+cutoff;
        window.history.pushState({path:newurl},'',newurl);
    }
    $("#jolecule").show();  
    $("#tempLoading").hide();          
    require( 
            ['/scripts/jolecule.js', 
            dataServerRoute+"/0/", 
            dataServerRoute+"/1/", 
            dataServerRoute+"/2/", 
            dataServerRoute+"/3/",  
            dataServerRoute+"/4/",  
            dataServerRoute+"/5/"], 
            function(jolecule, dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5) {  
                console.log({"dataServer0":dataServer0, "dataServer1":dataServer1, "dataServer2":dataServer2, "dataServer3":dataServer3, "dataServer4":dataServer4, "dataServer5":dataServer5});                
        jolecule.initEmbedJolecule({
            div_tag: '#jolecule',
            data_servers: [dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5],
            isGrid: true,
            loading_html:"<div class='loader'>Loading....</div>",
        });
    });     
};