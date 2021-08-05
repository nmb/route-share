# [route-share](https://nmb.github.io/route-share/)

Share map routes via URL:s.

## How it works
Users load [GPX](https://en.wikipedia.org/wiki/GPS_Exchange_Format) files, all
non-essential information is stripped, and the route is simplified using the
[Ramer-Douglas-Peucker
algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)
until the data is small enough to fit into an URL that can be shared
(optionally via a shortened link). All processing is carried out client side.

The route is drawn on top of an [OpenStreetMap](https://www.openstreetmap.org) layer.

## Examples 
* [2016 Paris-Roubaix route](https://tinyurl.com/yhcz5gn7)
* [Milan-San Remo](https://tinyurl.com/yds46dq8)
* [NY Marathon](https://tinyurl.com/yfezefxm)


## Credits
* [Draw GPS Track on OpenStreetMap](https://blog.aaronlenoir.com/2019/09/25/draw-gps-track-on-openstreetmap/)
* [GPX parser](https://github.com/Luuka/gpx-parser)
* [Ramer-Douglas-Peucker implementation](http://www.bdcc.co.uk/Gmaps/Services.htm)
* [Leaflet](https://leafletjs.com/)
* [Leaflet fullscreen button](https://github.com/Leaflet/Leaflet.fullscreen)
* [tinyURL](https://tinyurl.com) for generating shortened links.

