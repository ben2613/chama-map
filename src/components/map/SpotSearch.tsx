import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';
import { useTranslation } from 'react-i18next';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import type { PrefectureProperties, TrackProperties } from '@/types/map';
import { OVERSEAS_PREFECTURE } from '@/utils/mapPrefectureUtils';
import { buildSpotSearchIndex, searchSpots, type SpotSearchResult } from '@/utils/spotSearch';

interface SpotSearchProps {
  chamaTrack: FeatureCollection<Point, TrackProperties>;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  onSelect: (feature: Feature<Point, TrackProperties>) => void;
}

const SpotSearch: React.FC<SpotSearchProps> = ({ chamaTrack, japanData, onSelect }) => {
  const { t, i18n } = useTranslation();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

  const index = useMemo(() => buildSpotSearchIndex(chamaTrack), [chamaTrack]);

  const prefectureJaByEn = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of japanData.features) {
      const p = f.properties;
      if (p?.nam && p.nam_ja) map[p.nam] = p.nam_ja;
    }
    return map;
  }, [japanData]);

  const results = useMemo(
    () => searchSpots(index, query, { prefectureJaByEn, maxResults: 12 }),
    [index, query, prefectureJaByEn]
  );

  const showResults = open && query.trim().length > 0;

  useEffect(() => {
    if (!showResults || results.length === 0) return;
    const list = listRef.current;
    if (!list) return;
    const option = list.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showResults, results.length]);

  useEffect(() => {
    if (!showResults) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showResults]);

  const pick = useCallback(
    (result: SpotSearchResult) => {
      setQuery('');
      setOpen(false);
      setExpandedMobile(false);
      onSelect(result.feature);
    },
    [onSelect]
  );

  const prefectureLabel = (item: SpotSearchResult) => {
    if (item.prefecture === OVERSEAS_PREFECTURE) {
      return t('map.overseas');
    }
    const useJa = i18n.language.startsWith('ja');
    if (useJa && item.prefectureJa) return item.prefectureJa;
    return item.prefecture;
  };

  const spotLabel = (item: SpotSearchResult) =>
    i18n.language.startsWith('ja') ? item.nameJa || item.nameEn : item.nameEn || item.nameJa;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setExpandedMobile(false);
      inputRef.current?.blur();
      return;
    }
    if (!showResults || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[activeIndex];
      if (hit) pick(hit);
    }
  };

  const inputBlock = (
    <div className="relative flex min-w-0 flex-1 items-center">
      <FaMagnifyingGlass
        className={`pointer-events-none absolute left-2.5 text-sm transition-colors sm:text-red-500 ${
          expandedMobile || inputFocused ? 'text-red-500' : 'text-gray-400'
        }`}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setInputFocused(true);
        }}
        onBlur={() => setInputFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={t('spotSearch.placeholder')}
        aria-label={t('spotSearch.label')}
        aria-expanded={showResults}
        aria-controls={showResults ? listId : undefined}
        aria-autocomplete="list"
        className="h-11 w-full min-w-0 rounded-sm border-2 border-gray-300 bg-white/95 py-0 pl-8 pr-8 text-sm text-gray-800 placeholder:text-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
      />
      {query && (
        <button
          type="button"
          className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          aria-label={t('spotSearch.clear')}
        >
          <FaXmark aria-hidden />
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="chama-map-control pointer-events-auto fixed top-3 z-[10002] flex max-w-full items-center gap-2 spot-search"
      style={{
        left: 'calc(0.75rem + 2.75rem + 0.5rem)',
        right: 'calc(0.75rem + 2.75rem + 0.5rem)',
      }}
      data-control-position="topleft"
    >
      {/* Mobile: icon expands to full search row */}
      <button
        type="button"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2 bg-white/95 transition-colors hover:bg-gray-50 sm:hidden ${
          expandedMobile
            ? 'border-red-400 bg-red-50 text-red-500 shadow-sm'
            : 'border-gray-300 text-gray-600'
        }`}
        aria-label={t('spotSearch.open')}
        aria-expanded={expandedMobile}
        onClick={() => {
          setExpandedMobile((v) => !v);
          if (!expandedMobile) {
            requestAnimationFrame(() => inputRef.current?.focus());
          }
        }}
      >
        <FaMagnifyingGlass className={expandedMobile ? 'text-red-500' : undefined} aria-hidden />
      </button>

      <div
        className={`min-w-0 flex-1 flex-col ${expandedMobile ? 'flex' : 'hidden sm:flex'}`}
      >
        {inputBlock}
        {showResults && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="mt-1 max-h-64 overflow-y-auto rounded-sm border-2 border-gray-200 bg-white/98 py-1 shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{t('spotSearch.noResults')}</li>
            ) : (
              results.map((item, idx) => (
                <li key={item.popupId} role="presentation">
                  <button
                    type="button"
                    role="option"
                    data-result-index={idx}
                    aria-selected={idx === activeIndex}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-sky-50 ${
                      idx === activeIndex ? 'bg-sky-100' : ''
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => pick(item)}
                  >
                    <span className="font-medium text-gray-900">{spotLabel(item)}</span>
                    <span className="text-xs text-gray-500">{prefectureLabel(item)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SpotSearch;
