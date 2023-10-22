import MapGL from "react-map-gl";
import { LngLat, Map as Map_ } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";

import { createNoise2D } from 'simplex-noise';

function remove(map: Map_, id: string) {
  if (map.getLayer(id)) {
    map.removeLayer(id);
    map.removeSource(id);
  }
}

function addCircle(map: Map_, id: string, lngLat: LngLat, color = '#f00') {
  remove(map, id);

  map.addLayer({
    id: id,
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': color
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

async function fetchRoute(from: LngLat, to: LngLat, excludePoints: LngLat[]) {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat
    }?overview=full&geometries=geojson${excludePoints.length ? `&exclude=${excludePoints.map(lngLat => `point(${lngLat.lng} ${lngLat.lat})`).join(',')
      }` : ''}&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`,

    { method: "GET" }
  );

  const json = await query.json();
  const data = json.routes[0];
  return data.geometry.coordinates;
}

async function addRoute(map: Map_, id: string, from: LngLat, to: LngLat, excludePoints: LngLat[] = []) {
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
          coordinates: await fetchRoute(from, to, excludePoints),
        },
      },
    },
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#f00",
      "line-width": 5,
      "line-opacity": 0.75,
    },
  });
}

const noise2D = createNoise2D();
console.log();


function addHeatmap(map: Map_, id: string) {



  // bratislava bounds
  const bratislava = LngLat.convert([17.1077, 48.1486]).toBounds(5000);
  // random point in bratislava
  const points = [];

  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * (bratislava.getEast() - bratislava.getWest()) + bratislava.getWest();
    const y = Math.random() * (bratislava.getNorth() - bratislava.getSouth()) + bratislava.getSouth();


    const frequency = 30;

    const noise = (noise2D(x * frequency, y * frequency) + 1) / 2;

    const v = noise * Math.cos(LngLat.convert([x, y]).distanceTo(LngLat.convert([17.1077, 48.1486])) / 5000 * Math.PI / 2);

    console.log(v);

    points.push({ x, y, v });
  }




  const geojson = {
    "type": "FeatureCollection",
    "features": points.map(point => (
      {
        "type": "Feature",
        "properties": {
          "mm": point.v * 5,
        },
        "geometry": {
          "type": "Point",
          "coordinates": [point.x, point.y]
        }
      })
    ),
  };

  console.log(geojson);

  function staticZoom(multiplier: number) {
    const interpolate = [];

    for (let i = 0; i <= 25; i += 0.2) {
      interpolate.push(i, 2 ** i * multiplier);
    }

    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      ...interpolate
    ] as any;
  }

  map.addLayer(
    {
      'id': id,
      'type': 'heatmap',
      'source': {
        'type': 'geojson',
        'data': geojson as any
      },
      'maxzoom': 24,
      'paint': {
        'heatmap-weight': {
          property: 'mm',
          type: 'exponential',
          stops: [
            [1, 0],
            [62, 1]
          ]
        },
        // increase intensity as zoom level increases
        'heatmap-intensity': 5,
        // assign color values be applied to points depending on their density
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0,255,0,0)',
          0.2,
          'rgb(127,255,0)',
          0.4,
          'rgb(255,255,0)',
          0.6,
          'rgb(255,127,0)',
          0.8,
          'rgb(255,0,0)'
        ],
        // increase radius as zoom increases
        'heatmap-radius': staticZoom(0.004),
        // decrease opacity to transition into the circle layer
        'heatmap-opacity': 0.5
      }
    },
    'waterway-label'
  );
}


const Map = () => {
  const [path, setPath] = useState([] as mapboxgl.LngLat[]);
  const [floods, setFloods] = useState([] as mapboxgl.LngLat[]);

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
          addHeatmap(e.target, 'heatmap');
        }}
        onClick={(e) => {
          console.log(e.target.getZoom());

          if (path.length === 0) {
            console.log(e.lngLat.toArray());
            addCircle(e.target, 'start', e.lngLat);
            setPath([e.lngLat]);
          }



          else if (path.length === 1) {
            addCircle(e.target, 'end', e.lngLat);
            addRoute(e.target, 'route', path[0], e.lngLat, floods);
            setPath([...path, e.lngLat]);
          }

          else if (path.length === 2) {
            remove(e.target, 'start');
            remove(e.target, 'end');
            remove(e.target, 'route');
            addCircle(e.target, 'start', e.lngLat);
            setPath([e.lngLat]);
          }
        }}
        onContextMenu={(e) => {
          addCircle(e.target, 'flood-' + floods.length, e.lngLat, '#3887be');
          remove(e.target, 'route');
          addRoute(e.target, 'route', path[0], path[1], [...floods, e.lngLat]);
          setFloods([...floods, e.lngLat]);
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
