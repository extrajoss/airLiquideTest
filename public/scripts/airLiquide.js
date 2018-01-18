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

var checkSearch = function(elementName){
    var searchTerm = document.getElementById(elementName).value;
    if(searchTerm.length == 4){
        return true;
    }else if(searchTerm.length==6){
        $.getJSON({
            url: "/getUniprot/"+searchTerm,
            success: displayClusters
        }).fail(function(err) {
            console.log('Error: ' ,err);
        })
        .always(function(err) {
            console.log("Loaded");
        });
        return false;
    }else{
        return false;
    }
}

var displayClusters = function(res){
    if(res.ErrorText){
        console.error(res.ErrorText);  
        window.location.href = "/login";                           
        return;
    }
    console.log("displayClusters",res);
    showClustersTab(res);
}


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
    if (history.replaceState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?cutoff='+cutoff;
        window.history.replaceState({path:newurl},'',newurl);
    }
    $("#jolecule").show();  
    $("#tempLoading").hide();          
    require( 
            ['/scripts/jolecule3.js', 
            dataServerRoute+"/0/", 
            dataServerRoute+"/1/", 
            dataServerRoute+"/2/", 
            dataServerRoute+"/3/",  
            dataServerRoute+"/4/",  
            dataServerRoute+"/5/"], 
            function(jolecule, dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5) {                  
                j = jolecule.initEmbedJolecule({
                    divTag: '#jolecule',
                    isGrid: true,
                    loadingHtml:"<div class='loader'>Loading....</div>",
                });
                for (var dataServer of [dataServer0, dataServer1, dataServer2, dataServer3, dataServer4, dataServer5]) {
                    j.addDataServer(dataServer);
                };
            });     
    };
var selectGoogleSpreadsheet = function(el,link){
    removeClass(document.querySelector(".selectedSpreadsheet"),"selectedSpreadsheet");
    addClass(el,"selectedSpreadsheet");
    showGoogleSpreadsheet(link);
};
var showGoogleSpreadsheet= function(link){
    document.getElementById('googleSpreadSheet').src = link;
    setTimeout(showSpreadsheetTab,500);
};
var showSpreadsheetTab= function(){
    addClass(document.getElementById("dataSetsTab"),"inactive");
    addClass(document.getElementById("clustersTab"),"inactive");
    removeClass(document.getElementById("spreadsheetTab"),"inactive");

    document.getElementById('googleSpreadSheet').style.display = 'block';
    document.getElementById('clusters').style.display = 'none';
    document.getElementById('googleSpreadSheetMap').style.display = 'none';
};
var showDataSetsTab= function(){
    addClass(document.getElementById("spreadsheetTab"),"inactive");
    addClass(document.getElementById("clustersTab"),"inactive");
    removeClass(document.getElementById("dataSetsTab"),"inactive");

    document.getElementById('googleSpreadSheet').style.display = 'none';
    document.getElementById('clusters').style.display = 'none';
    document.getElementById('googleSpreadSheetMap').style.display = 'block';
};
var showClustersTab= function(data){
    addClass(document.getElementById("spreadsheetTab"),"inactive");
    addClass(document.getElementById("dataSetsTab"),"inactive");
    removeClass(document.getElementById("clustersTab"),"inactive");
    
    document.getElementById('clusters').style.display = 'block';
    document.getElementById('googleSpreadSheet').style.display = 'none';
    document.getElementById('googleSpreadSheetMap').style.display = 'none';

    if(data){
        document.getElementById('clustersBody').innerHTML = '';
        for (var row of data) {
        console.log(row);
        tableRow = htmlToElement("<tr><td>"+
        row["cluster index"]+
        "</td><td>"+
        row["cluster size"]+
        "</td><td>"+
        clusterLink(row)+
        "</td><td>"+
        row["top pdb chain"]+
        "</td><td>"+
        row["alignment score"]+
        "</td></tr>");
        document.getElementById('clustersBody').appendChild(tableRow);
    };
    }
    

};
var clusterLink = function(row){
    if(row["fileName"]){
            return "<a target='_blank' href ='"+ row["top pdb"] + "'>"+row["top pdb"]+"</a>";
        }  else{
            return row["top pdb"];
        }  
}

function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
}

var showData = function(){
    addClass(document.getElementById("dataNav"),"active");
    removeClass(document.getElementById("aboutNav"),"active");
    document.getElementById('about').style.display = 'none';
    document.getElementById('data').style.display = 'flex';
};
var showAbout = function(){
    addClass(document.getElementById("aboutNav"),"active");
    removeClass(document.getElementById("dataNav"),"active");
    document.getElementById('data').style.display = 'none';
    document.getElementById('about').style.display = 'flex';
}
var hasClass = function(el, className) {
  if (el.classList)
    return el.classList.contains(className)
  else
    return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

var addClass = function (el, className) {
  if (el.classList)
    el.classList.add(className)
  else if (!hasClass(el, className)) el.className += " " + className
}

removeClass = function (el, className) {
  if (el.classList)
    el.classList.remove(className)
  else if (hasClass(el, className)) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
    el.className=el.className.replace(reg, ' ')
  }
}