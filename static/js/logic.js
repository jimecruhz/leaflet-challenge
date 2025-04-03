// Create the 'basemap' tile layer that will be the background of our map.
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

//grayscale layer
var grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// water color layer 
var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
	minZoom: 1,
	maxZoom: 16,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

//topography 
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//make the bsaemaps objects 
let basemaps= {
  GrayScale: grayscale ,
  "Water Color": waterColor,
  "Topography" : topoMap,
  Default : defaultMap, 
};

//map object 
var myMap= L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, grayscale, waterColor, topoMap]
});

//add the default map to the map 
defaultMap.addTo(myMap);

//add the Layer control 
 

  //get the data for the tectonic plates and draw on the map 
  //variable to hold the tecctonic plates layer 
let tectonicplates = new L.layerGroup();

 d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json")
 .then(function(plateData){
  L.geoJson(plateData, { 
    color: "yellow", 
    weight: 1
  }).addTo(tectonicplates);
  
 });

 tectonicplates.addTo(myMap); 

//create the info for the overlay for the earthquakes data layer
let earthquakes = new L.layerGroup();

//get the data for the earthquake and populate the layer group 
//call the usgs geojson API 
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
  function(earthquakeData){
      console.log(earthquakeData);
      //plot circles, whee the radius is dep on  the magnitude and color w depth 
      function dataColor(depth){
          if (depth > 90)
            return "red";
          else if (depth > 70)
            return "#fc4903";
          else if (depth > 50) 
            return "#fc8403";
          else if (depth > 30)
            return "#fcad03";
          else if (depth > 10)
            return "#cafc03";
          else 
          return "green";
      }
  function radiusSize(mag){
    if (mag == 0)
      return 1; 
    else 
      return mag * 5; 
      }

      function dataStyle(feature)
      {
          return {
            opacity: .5,
            fillOpacity: .5,
            fillColor: dataColor(feature.geometry.coordinates[2]),
            color: "000000", 
            radius: radiusSize(feature.properties.mag), 
            weight: 0.5,
            stroke: true 

          }

      }

      //add the GeoJson data 
      L.geoJson(earthquakeData, { 
        // features 
        pointToLayer: function(feature, latLng){
          return L.circleMarker(latLng);
        },
        style: dataStyle, 

        onEachFeature: function(feature, layer){
          layer.bindPopup(`
            Magnitude: <b>${feature.properties.mag}</b><br>
            Depth: <b>${feature.geometry.coordinates[2]}</b><br>
            Location: <b>${feature.properties.place}</b>
          `);
               
        }

      }).addTo(earthquakes);

   }
  
);

 let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes,
 };

 L.control 
  .layers(basemaps, overlays)
  .addTo(myMap);

let legend = L.control({
    position: "bottomright"
  });

legend.onAdd = function(){
    let div = L.DomUtil.create("div", "info legend"); 

    let intervals = [-10, 10, 30, 50, 70, 90];

    let colors = [
      "green",
      "#cafc03",
      "#fcad03",
      "#fc8403",
      "#fc4903",
      "red"
    ];
    // loop through the intervals and the colors and generate a label 
    //with a colored square for each interval 
    for (let i = 0; i < intervals.length; i++) {
      div.innerHTML +=
        "<i style='background:" + colors[i] + "'></i> " +
        intervals[i] +
        (intervals[i + 1]
          ? "&ndash;" + intervals[i + 1] + " km<br>"
          : "+ km");
    }
    return div; 
  };

legend.addTo(myMap); 