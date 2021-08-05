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
      try {
        this.points = this.str2Points(window.location.hash.substring(1))
      }
      catch(e) {
        console.log("Malformed data.")
        return
      }

      let gpx = new gpxParser();
      let distance = gpx.calculDistance(routeShare.points.map( p => Object.fromEntries([["lat",p[0]],["lon",p[1]]])))
      document.getElementById("totalDistance").innerText = (distance.total/1000).toFixed(3);
      this.drawTrack()
      document.getElementById("downloadButton").style.display = ""
      document.getElementById("tinyURLButton").style.display = ""
      document.getElementById("distanceDiv").style.display = ""
      let sl = document.getElementById("tinyurl")
      if(sl) {
        sl.parentNode.removeChild(sl)
      }
    }
    else {
      document.getElementById("map").style.display = "none";
      document.getElementById("downloadButton").style.display = "none"
      document.getElementById("tinyURLButton").style.display = "none"
      document.getElementById("distanceDiv").style.display = "none"
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
      document.getElementById("distanceDiv").style.display = ""

      const track = gpx.tracks[0]
      let coordinates = track.points.map(p => [p.lat, p.lon]);
      let tolerance = 4
      let dataString = ""
      console.log("No of points: " + coordinates.length)
      // calculate simplified route with increasing tolerance 
      // until URL is short enough
      do {
        this.points = GDouglasPeucker(track.points, tolerance).map(p => [p.lat, p.lon])
        dataStr = this.points2Str(this.points)
        console.log("tolerance, no of points, str length: ", tolerance, this.points.length, dataStr.length)
        tolerance *= 2
      }
      while(dataStr.length > 8000 && tolerance < 4096);

      // remove old short link (if any)
      let sl = document.getElementById('tinyurl')
      if(sl) {
        sl.parentNode.removeChild(sl)
      }
      document.getElementById("tinyURLButton").style.display = "";
      window.history.pushState('', '', "#" + dataStr)
      this.drawTrack(this.points)
    }

  },
  // from https://stackoverflow.com/a/61738144
  createXmlString: function() {
    let result = '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="runtracker"><metadata/><trk><name></name><desc></desc>'
    result += this.points.reduce((accum, curr) => {
      let segmentTag = '<trkseg>';
      segmentTag += `<trkpt lat="${curr[0].toFixed(5)}" lon="${curr[1].toFixed(5)}"></trkpt>`
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
  },

  points2Delta: function(p, reverse = false) {
    let res = []
    res.push([p[0][0], p[0][1]])
    for(let i = 1; i < p.length; i++) {
      if(reverse) {
        res.push([p[i][0]+res[i-1][0], p[i][1]+res[i-1][1]])
      }
      else {
        res.push([p[i][0]-p[i-1][0], p[i][1]-p[i-1][1]])
      }
    }
    return(res)
  },
  points2Str: function(){
    let diffArr = this.points2Delta(this.points)
    let scale = Math.max(...diffArr.flat().slice(2).map( x => Math.abs(x)))
    return([scale.toFixed(5), diffArr.slice(0,1).flat(), diffArr.flat().slice(2).map( 
      x => parseFloat((x/scale).toFixed(5)))].flat().toString().replaceAll(",","!"))

  },
  str2Points: function(str){
    let res = []
    let tmpArr = str.split("!").map( x => parseFloat(x))
    let scale = parseFloat(tmpArr.shift())
    res.push(tmpArr.slice(0,2))
    for(let i = 2; i < tmpArr.length-1; i += 2) {
      res.push([tmpArr[i] * scale,tmpArr[i+1] * scale])
    }
    return(this.points2Delta(res, true))
  }
}

