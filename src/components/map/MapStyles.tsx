const MapStyles = () => (
  <style jsx>{`
    :global(.leaflet-pane.leaflet-overlay-pane path) {
      transition: fill-opacity 0.5s ease;
    }
  `}</style>
);

export default MapStyles;
