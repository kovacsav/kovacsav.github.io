const numberOfColumns = 240;
const numberOfRows = 168;
const cellXSize = 0.035701;
const cellYSize = 0.024147;
const xLeftCorner = 15.288;
const yTopCorner = 49.1129;

const debrecenXcoord = 21.65;
const debrecenYcoord = 47.57;

const kaposvarXcoord = 17.88;
const kaposvarYcoord = 46.36;

const budapestXcoord = 19.04;
const budapestYcoord = 47.5;

const szegedXcoord = 20.19;
const szegedYcoord = 46.24;

const calculateArrayNumber = (xCoord, yCoord) => {
  return Math.floor(
    (numberOfColumns * (yTopCorner - yCoord)) / cellYSize +
      (xCoord - xLeftCorner) / cellXSize
  );
};

const debrecenArrayNumber = calculateArrayNumber(
  debrecenXcoord,
  debrecenYcoord
);
const kaposvarArrayNumber = calculateArrayNumber(
  kaposvarXcoord,
  kaposvarYcoord
);
const budapestArrayNumber = calculateArrayNumber(
  budapestXcoord,
  budapestYcoord
);
const szegedArrayNumber = calculateArrayNumber(szegedXcoord, szegedYcoord);

let map = L.map("map");

const temperatureIcon = L.icon({
  iconUrl: "./temp_backg2.png", // the background image
  iconSize: [60, 40], // size of the icon
});

const windIcon = L.icon({
  iconUrl: "./wind_backg4.png", // the background image
  iconSize: [60, 40], // size of the icon
});

const getWindspeed = (u, v) => {
  return Math.sqrt(u ** 2 + v ** 2).toFixed(1);
};

let popupTemperatureText = "";

/* Basemap */
let url =
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png";
//let url =
("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png");

L.tileLayer(url, {
  attribution: "OSM & Carto",
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

const setTemperatureMarker = (xCoord, yCoord, temp) => {
  const marker = new L.marker([yCoord, xCoord], { icon: temperatureIcon });
  marker.bindTooltip(`${temp}`, {
    permanent: true,
    direction: "center",
    className: "my-labels",
  });
  marker.addTo(map);
};

const setWindMarker = (xCoord, yCoord, wind) => {
  const marker = new L.marker([yCoord, xCoord], { icon: windIcon });
  marker.bindTooltip(`${wind}`, {
    permanent: true,
    direction: "center",
    className: "my-labels",
  });
  marker.addTo(map);
};

/* An ASCIIGrid Raster with Surface current velocity */
d3.text("./data/T_data20221229_0600+00000.asc", function (asc) {
  let s = L.ScalarField.fromASCIIGrid(asc);

  let debrecenTemperature = s.zs[debrecenArrayNumber].toFixed(1);
  let kaposvarTemperature = s.zs[kaposvarArrayNumber].toFixed(1);

  s.cellYSize = cellYSize;
  s.yurCorner = 49.1129;
  let c = chroma.scale(["blue", "green", "yellow", "red"]).domain(s.range);

  let identify = function (e) {
    if (e.value !== null) {
      let v = e.value.toFixed(1);
      popupTemperatureText = `Current surface temperature is ${v} Celsius degree, `;
      /*
          let popupTemperature = `<span class="popupText">Surface current temperature ${v} Celsius degree</span>`;
          let popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
          */
    }
  };

  // Bilinear interpolation
  let interpolated = L.canvasLayer.scalarField(s, {
    interpolate: true,
    color: c,
  });
  interpolated.on("click", identify);
  interpolated.addTo(map);
  interpolated.setOpacity(0.8);

  setTemperatureMarker(debrecenXcoord, debrecenYcoord, debrecenTemperature);

  setTemperatureMarker(kaposvarXcoord, kaposvarYcoord, kaposvarTemperature);

  /*
    // vs original
    let original = L.canvasLayer.scalarField(s, {
      color: c,
    });
    original.on('click', identify);
    map.fitBounds(interpolated.getBounds());
    original.setOpacity(0.8);


    L.control.layers({
      "Interpolated": interpolated,
      "Original": original
    }, {}, {
      position: 'bottomleft',
      collapsed: false
    }).addTo(map);
*/
});

/* Default vectorfield animation, from two ASCIIGrid files with u|v current velocity */
d3.text("data/u_data20221229_0600+00000.asc", function (u) {
  d3.text("data/v_data20221229_0600+00000.asc", function (v) {
    let vf = L.VectorField.fromASCIIGrids(u, v);

    let budapestWind = getWindspeed(
      vf.us[budapestArrayNumber],
      vf.vs[budapestArrayNumber]
    );
    let szegedWind = getWindspeed(
      vf.us[szegedArrayNumber],
      vf.vs[szegedArrayNumber]
    );

    console.log(vf);
    vf.cellYSize = 0.024147;
    vf.yurCorner = 49.1129;
    let layer = L.canvasLayer.vectorFieldAnim(vf).addTo(map);
    map.fitBounds(layer.getBounds());

    layer.on("click", function (e) {
      if (e.value !== null) {
        let vector = e.value;
        let v = vector.magnitude().toFixed(1);

        let d = parseInt(vector.directionTo().toFixed(0));
        d = d + 180 < 360 ? d + 180 : d - 180;
        let popupWind = `<span class="popupText">${popupTemperatureText}and wind speed is ${v} m/s from ${d}&deg.</span>`;
        let popup = L.popup()
          .setLatLng(e.latlng)
          .setContent(popupWind)
          .openOn(map);
      }
    }); // {onClick: callback} inside 'options' is also supported when using layer contructor

    setWindMarker(budapestXcoord, budapestYcoord, budapestWind);
    setWindMarker(szegedXcoord, szegedYcoord, szegedWind);
  });
});

L.tileLayer(url, {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
}).addTo(map);

/*
    const myGeoJSONPath = "data/test.json";
    getJSON(myGeoJSONPath,function(data){
      var map = L.map('map').setView([39.74739, -105], 4);
      */

const myCustomStyle = {
  stroke: true,
  fill: false,
  fillColor: "black",
  //fillOpacity: 0,
  color: "black",
  weight: 3,
  opacity: 1,
};

L.geoJson(hungary, {
  clickable: false,
  style: myCustomStyle,
}).addTo(map);
//})

//map.setZoom(12);
