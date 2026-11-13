import React, { forwardRef, useImperativeHandle } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { useTranslation } from 'react-i18next';
import { FaLink, FaTwitter, FaYoutube, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import styles from './TrackMarker.module.css';
import Image from '@/components/ui/Image';
import { resolveTrackAssetUrl } from '@/services/kmlToChamaTrack';

export interface TrackMarkerHandle {
  openPopup: () => void;
}

interface TrackMarkerProps {
  coordinates: [number, number];
  icon: string;
  groupedKey?: string;
  groupedTracks?: Feature<Point, TrackProperties>[];
  prefecture?: string;
  popupId: string;
  activePopupId?: string | null;
  onOpenPopup: (popupId: string) => void;
  onClosePopup: () => void;
}

function linkText(link: string) {
  if (link.includes('twitter') || link.includes('x.com')) {
    return <FaTwitter className="text-blue-500 text-xl" />;
  }
  if (link.includes('youtube') || link.includes('youtu.be')) {
    return <FaYoutube className="text-red-500 text-xl" />;
  }
  return <FaLink className="text-blue-400 text-xl" />;
}

const TrackMarker = forwardRef<TrackMarkerHandle, TrackMarkerProps>(
  ({ icon, coordinates, groupedTracks, popupId, activePopupId, onOpenPopup, onClosePopup }, ref) => {
  const { i18n } = useTranslation();
  const open = activePopupId === popupId;
  const [imgIndex, setImgIndex] = React.useState(0);
  const [groupIndex, setGroupIndex] = React.useState(0);

  const active = groupedTracks && groupedTracks.length > 0 ? groupedTracks[groupIndex] : undefined;
  const activeProps: TrackProperties | undefined = active?.properties as TrackProperties | undefined;
  const displayTitle = i18n.language.startsWith('ja') ? activeProps?.nameJp : activeProps?.name;
  const displayDescription = i18n.language.startsWith('ja') ? activeProps?.descriptionJp : activeProps?.description;
  const displayImages = activeProps?.images ?? [];
  const displayLinks = activeProps?.links ?? [];
  const displayLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayTitle || '')}`;

  useImperativeHandle(ref, () => ({
    openPopup: () => onOpenPopup(popupId),
  }));

  const handlePrev = () => setImgIndex((idx) => (idx > 0 ? idx - 1 : idx));
  const handleNext = () =>
    setImgIndex((idx) => (displayImages && idx < displayImages.length - 1 ? idx + 1 : idx));

  React.useEffect(() => {
    setGroupIndex(0);
  }, [groupedTracks]);
  React.useEffect(() => {
    setImgIndex(0);
  }, [groupIndex]);
  const longitude = coordinates[0];
  const latitude = coordinates[1];

  return (
    <>
      <Marker
        longitude={longitude}
        latitude={latitude}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onOpenPopup(popupId);
        }}
      >
        <img
          src={
            resolveTrackAssetUrl(icon) || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
          }
          alt=""
          width={icon ? 28 : 25}
          height={icon ? 28 : 41}
          className="drop-shadow-md cursor-pointer"
          title={displayTitle}
        />
      </Marker>
      {open && (
        <Popup
          longitude={longitude}
          latitude={latitude}
          anchor="bottom"
          closeOnClick
          maxWidth="320px"
          onClose={onClosePopup}
          className={styles['custom-popup']}
        >
          <div className={styles['popup-container']}>
            <div className={styles['title-section']}>
              {displayTitle && (
                <a className={styles['location-title']} target="_blank" rel="noopener noreferrer" href={displayLink}>
                  {displayTitle}
                </a>
              )}
            </div>

            {displayDescription && <div className={styles.description}>{displayDescription}</div>}

            {displayImages.length > 0 && (
              <div className={styles['image-gallery']}>
                {displayImages.length > 1 && (
                  <button
                    className={`${styles['gallery-nav']} ${styles['prev-gallery']}`}
                    onClick={handlePrev}
                    disabled={imgIndex === 0}
                    aria-label="Previous image"
                  >
                    <FaChevronLeft />
                  </button>
                )}
                <div className={styles['image-container']}>
                  <Image
                    src={
                      displayImages[imgIndex].includes('youtube.com') || displayImages[imgIndex].includes('youtu.be')
                        ? displayImages[imgIndex]
                        : import.meta.env.VITE_CORS_PROXY + displayImages[imgIndex]
                    }
                    alt={displayTitle}
                    className={styles['gallery-image']}
                  />
                  {displayImages.length > 1 && (
                    <div className={styles['image-counter']}>
                      {imgIndex + 1} / {displayImages.length}
                    </div>
                  )}
                </div>
                {displayImages.length > 1 && (
                  <button
                    className={`${styles['gallery-nav']} ${styles['next-gallery']}`}
                    onClick={handleNext}
                    disabled={imgIndex === displayImages.length - 1}
                    aria-label="Next image"
                  >
                    <FaChevronRight />
                  </button>
                )}
              </div>
            )}

            {displayLinks.length > 0 && (
              <div className={styles['social-links']}>
                {displayLinks.map((link, index) => (
                  <a key={index} href={link} target="_blank" rel="noopener noreferrer" className={styles['social-link']}>
                    {linkText(link)}
                  </a>
                ))}
              </div>
            )}

            {groupedTracks && groupedTracks.length > 1 && (
              <div className={styles['group-navigation']}>
                <button
                  className={styles['nav-button']}
                  onClick={() => setGroupIndex((i) => (i > 0 ? i - 1 : groupedTracks.length - 1))}
                >
                  <FaChevronLeft />
                </button>
                <span className={styles['group-counter']}>
                  {groupIndex + 1} / {groupedTracks.length}
                </span>
                <button
                  className={styles['nav-button']}
                  onClick={() => setGroupIndex((i) => (i < groupedTracks.length - 1 ? i + 1 : 0))}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </Popup>
      )}
    </>
  );
});

TrackMarker.displayName = 'TrackMarker';

export default TrackMarker;
