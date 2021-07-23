var routeShare = {
  mymap: null,
  myroute: null,
  routeData: null,

  initialize: function(){
    this.mymap = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 50
    }).addTo(this.mymap);
    this.mymap.addControl(new L.Control.Fullscreen());
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

      const points = trackData.map(p => {
        let np = {}
        np["lat"] = parseFloat(p[0])
        np["lon"] = parseFloat(p[1])
        return np
      })
      let gpx = new gpxParser();
      let distance = gpx.calculDistance(points)
      document.getElementById("totalDistance").innerText = (distance.total/1000).toFixed(3);
      this.drawTrack(trackData)
    }
  },

  createTinyURL: async function (){
    console.log("Creating tinyurl.")
    //let url = encodeURIComponent(window.location.href.split('#')[0] + "#" + window.routeShare.routeData)
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
    document.getElementById("shortlink").appendChild(a)
    return(tinyURL)
  },
  drawTrack: function (points) {
    if(this.myroute){
      this.mymap.removeLayer(this.myroute)
    }
    document.getElementById("map").style.display = "";
    this.myroute = L.polyline(points, { weight: 6, color: 'darkred' })
    this.myroute.addTo(this.mymap);
    // zoom the map to the polyline
    this.mymap.fitBounds(this.myroute.getBounds());
  },
  loadTrack: function (input) {

    let file = input.files[0];
    let reader = new FileReader();
    reader.readAsText(file)
    reader.onload = function() {
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
      let s_coordinates = []
      let dataString = ""
      console.log("No of points: " + coordinates.length)
      // calculate simplified route with increasing tolerance 
      // until URL is short enough
      do {
        s_coordinates = GDouglasPeucker(track.points, tolerance).map(p => [p.lat.toFixed(5), p.lon.toFixed(5)]) 
        dataStr = lzw_encode(JSON.stringify(s_coordinates))
        console.log(tolerance, s_coordinates.length, dataStr.length)
        tolerance *= 2
      }
      while(encodeURIComponent(dataStr).length > 8000 && tolerance < 4096);

      console.log(lzw_encode(JSON.stringify(s_coordinates)))
      // remove old short link (if any)
      let sl = document.getElementById('tinyurl')
      if(sl) {
        sl.parentNode.removeChild(sl)
      }
      document.getElementById("tinyURLButton").style.display = "";
      let routeData = lzw_encode(JSON.stringify(s_coordinates))
      window.history.pushState('', '', "#" + encodeURIComponent(routeData))
      window.routeShare.drawTrack(s_coordinates)
    }

  }
}
