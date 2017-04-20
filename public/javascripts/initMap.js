var map;
var mapGeoadmin;
var ajaxRequest;
var plotlist;
var plotlayers=[];

function initmap() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 20, attribution: osmAttrib});

    // start the map in South-East England
    map.setView(new L.LatLng(47.3, 8.55),9);
    map.addLayer(osm);


    //GeoAdmin Map
    var layer1 = ga.layer.create('ch.swisstopo.pixelkarte-farbe');
    var layer2 = ga.layer.create('ch.are.gemeindetypen');
    mapGeoadmin = new ga.Map({
        target: 'mapGeoAdmin',
        layers: [layer1, layer2],
        view: new ol.View({
            resolution: 500,
            center: [670000, 160000]
        })
    });
}

initmap();