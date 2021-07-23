# [route-share](https://nmb.github.io/route-share/)

Share map routes via URL:s.

## How it works
Users load [GPX](https://en.wikipedia.org/wiki/GPS_Exchange_Format) files, all
non-essential information is stripped, and the route if simplified using the
[Ramer-Douglas-Peucker
algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)
until the data is small enough to fit into an URL that can be shared. 

The route is drawn on top of an [Open Streetmap](https://www.openstreetmap.org) layer.

## Credits
* [Draw GPS Track on OpenStreetMap](https://blog.aaronlenoir.com/2019/09/25/draw-gps-track-on-openstreetmap/)
* [GPX parser](https://github.com/Luuka/gpx-parser)
* [Ramer-Douglas-Peucker implementation](http://www.bdcc.co.uk/Gmaps/Services.htm)
* [Leaflet](https://leafletjs.com/)
* [Leaflet fullscreen button](https://github.com/Leaflet/Leaflet.fullscreen)
* [LZW compression](https://gist.github.com/revolunet/843889)
* [tinyURL](https://tinyurl.com) for generating shortened links.

