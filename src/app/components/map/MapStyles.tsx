const MapStyles = () => (
  <style jsx>{`
    .prefecture-border {
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
      transition: all 0.3s ease;
    }

    .prefecture-hover {
      filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.2));
      transform: scale(1.02);
    }

    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    .leaflet-popup-tip {
      background: rgba(255, 255, 255, 0.95);
    }
  `}</style>
);

export default MapStyles;