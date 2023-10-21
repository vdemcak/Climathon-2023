import MapGL from "react-map-gl";
import { LngLat, Map as Map_ } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";

function remove(map: Map_, id: string) {
  if(map.getLayer(id)) {
    map.removeLayer(id);
    map.removeSource(id);
  }
}

function addCircle(map: Map_, id: string, lngLat: LngLat) {
  remove(map, id);

  map.addLayer({
    id: id,
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': '#f00'
    },
    source: {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat]
        },
        properties: {}
      }
    }
  })
}

async function fetchRoute(from: LngLat, to: LngLat) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}${
    ''}?steps=true&geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`,

    { method: "GET" }
  );

  const json = await query.json();
  const data = json.routes[0];
  return data.geometry.coordinates;
}

async function addRoute(map: Map_, id: string, from: LngLat, to: LngLat) {
  remove(map, id);

  map.addLayer({
    id: id,
    type: "line",
    source: {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: await fetchRoute(from, to),
        },
      },
    },
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#3887be",
      "line-width": 5,
      "line-opacity": 0.75,
    },
  });
}



const Map = () => {
  const [path, setPath] = useState([] as mapboxgl.LngLat[]);

  return (
    <div className='w-screen h-screen'>
      <MapGL
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 17.1077,
          latitude: 48.1486,
          zoom: 14,
        }}
        onLoad={(e) => {
          e.target.resize();
        }}
        onClick={(e) => {
          if(path.length === 0) {
            console.log(e.lngLat.toArray());
            addCircle(e.target, 'start', e.lngLat);
            setPath([e.lngLat]);
          }

          else if(path.length === 1) {
            addCircle(e.target, 'end', e.lngLat);
            addRoute(e.target, 'route', path[0], e.lngLat);
            setPath([...path, e.lngLat]);
          }

          else if(path.length === 2) {
            remove(e.target, 'start');
            remove(e.target, 'end');
            remove(e.target, 'route');
            addCircle(e.target, 'start', e.lngLat);
            setPath([e.lngLat]);
          }
        }}
        dragRotate={false}
        touchPitch={false}
        pitch={0}
        minZoom={12}
        mapStyle='mapbox://styles/mapbox/streets-v9'
      />
    </div>
  );
};

export default Map;
