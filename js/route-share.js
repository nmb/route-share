const routeShare = {
  mymap: null,
  myroute: null,
  routeData: null,
  points: null,

  initialize: function(){
    this.mymap = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 50
    }).addTo(this.mymap);
    this.mymap.addControl(new L.Control.Fullscreen());
    L.control.locate().addTo(this.mymap);
  },

  setStateFromURL: function() {
    if(window.location.hash) {
      let trackData
      try {
        const jsonStr = lzw_decode(decodeURIComponent(window.location.hash.substring(1)))
        trackData = JSON.parse(jsonStr) 
      }
      catch(e) {
        console.log("Malformed data.")
        return
      }

      this.points = trackData.map(p => {
        let np = {}
        np["lat"] = parseFloat(p[0])
        np["lon"] = parseFloat(p[1])
        return np
      })
      let gpx = new gpxParser();
      let distance = gpx.calculDistance(this.points)
      document.getElementById("totalDistance").innerText = (distance.total/1000).toFixed(3);
      this.drawTrack()
    }
  },

  createTinyURL: async function (){
    console.log("Creating tinyurl.")
    let url = encodeURIComponent(window.location.href)
    let res = await fetch('https://tinyurl.com/api-create.php?url=' + url)
    const tinyURL = await res.text()
    document.getElementById("tinyURLButton").style.display = "none";
    // add link to document
    let a = document.createElement('a');
    let linkText = document.createTextNode(tinyURL);
    a.appendChild(linkText);
    a.href = tinyURL
    a.id = 'tinyurl'
    document.getElementById("shortlink").prepend(a)
    return(tinyURL)
  },
  drawTrack: function () {
    if(this.myroute){
      this.mymap.removeLayer(this.myroute)
    }
    document.getElementById("map").style.display = "";
    document.getElementById("downloadButton").style.display = "";
    this.myroute = L.polyline(this.points, { weight: 6, color: 'darkred' })
    this.myroute.addTo(this.mymap);
    // zoom the map to the polyline
    this.mymap.fitBounds(this.myroute.getBounds());
  },
  loadTrack: function (input) {

    let file = input.files[0];
    let reader = new FileReader();
    reader.readAsText(file)
    reader.onload = () => {
      let gpx = new gpxParser();
      try {
        gpx.parse(reader.result);
      }
      catch(e) {
        alert("Malformed URL.")
        return
      }
      document.getElementById("totalDistance").innerText = (gpx.tracks[0].distance.total / 1000).toFixed(3);

      const track = gpx.tracks[0]
      let coordinates = track.points.map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]);
      let tolerance = 4
      let dataString = ""
      console.log("No of points: " + coordinates.length)
      // calculate simplified route with increasing tolerance 
      // until URL is short enough
      do {
        this.points = GDouglasPeucker(track.points, tolerance).map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]) 
        dataStr = lzw_encode(JSON.stringify(this.points))
        console.log("tolerance, no of points, str length: ", tolerance, this.points.length, dataStr.length)
        tolerance *= 2
      }
      while(encodeURIComponent(dataStr).length > 8000 && tolerance < 4096);

      // remove old short link (if any)
      let sl = document.getElementById('tinyurl')
      if(sl) {
        sl.parentNode.removeChild(sl)
      }
      document.getElementById("tinyURLButton").style.display = "";
      let routeData = lzw_encode(JSON.stringify(this.points))
      window.history.pushState('', '', "#" + encodeURIComponent(routeData))
      this.drawTrack(this.points)
    }

  },
  // from https://stackoverflow.com/a/61738144
  createXmlString: function() {
    let result = '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker"><metadata/><trk><name></name><desc></desc>'
    result += this.points.reduce((accum, curr) => {
      let segmentTag = '<trkseg>';
      segmentTag += `<trkpt lat="${curr[0]}" lon="${curr[1]}"></trkpt>`
      segmentTag += '</trkseg>'

      return accum += segmentTag;
    }, '');
    result += '</trk></gpx>';
    return result;
  },

  downloadGpxFile: function() {
    const xml = this.createXmlString();
    const url = 'data:text/json;charset=utf-8,' + xml;
    const link = document.createElement('a');
    link.download = 'route-share.gpx';
    link.href = url;
    document.body.appendChild(link);
    link.click();
  }

}

