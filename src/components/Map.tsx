import MapGL from "react-map-gl";

import "mapbox-gl/dist/mapbox-gl.css";

const Map = () => {
  return (
    <div className='w-screen h-screen'>
      <MapGL
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 17.1077,
          latitude: 48.1486,
          zoom: 14,
        }}
        onLoad={(map) => {
          map.target.resize();
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
