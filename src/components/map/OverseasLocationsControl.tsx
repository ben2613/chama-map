import { useMemo, useState } from 'react';
import { FaGlobe, FaXmark } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import type { Feature, Point } from 'geojson';
import type { TrackProperties } from '@/types/map';
import { getGroupingKeyForFeature } from '@/utils/groupTrackFeatures';
import { resolveTrackAssetUrl } from '@/services/kmlToChamaTrack';

const controlBtnClass = `
  w-11 h-11 shrink-0 p-0 bg-white border-2 border-gray-300 rounded-sm
  flex items-center justify-center leading-none
  hover:bg-gray-50 active:bg-gray-100
  transition-colors duration-150 cursor-pointer
`;

interface OverseasLocationsControlProps {
  groups: Feature<Point, TrackProperties>[][];
  onSelect: (feature: Feature<Point, TrackProperties>) => void;
  onOpenChange?: (open: boolean) => void;
}

type CountrySection = {
  code: string;
  label: string;
  groups: Feature<Point, TrackProperties>[][];
};

function countryLabel(code: string, locale: string, unknownLabel: string): string {
  if (!code) return unknownLabel;
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region' }).of(code);
    return name ?? code;
  } catch {
    return code;
  }
}

export default function OverseasLocationsControl({
  groups,
  onSelect,
  onOpenChange,
}: OverseasLocationsControlProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const sections = useMemo((): CountrySection[] => {
    const unknownLabel = t('map.unknownCountry');
    const locale = i18n.language.startsWith('ja') ? 'ja' : 'en';
    const byCode = new Map<string, Feature<Point, TrackProperties>[][]>();

    for (const group of groups) {
      const code = (group[0]?.properties.country ?? '').toUpperCase();
      const list = byCode.get(code);
      if (list) list.push(group);
      else byCode.set(code, [group]);
    }

    return [...byCode.entries()]
      .map(([code, countryGroups]) => ({
        code,
        label: countryLabel(code, locale, unknownLabel),
        groups: countryGroups,
      }))
      .sort((a, b) => {
        if (!a.code && b.code) return 1;
        if (a.code && !b.code) return -1;
        return a.label.localeCompare(b.label, locale);
      });
  }, [groups, i18n.language, t]);

  if (groups.length === 0) return null;

  const setOpenState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    // Fixed footprint so the left panel never pushes GPS / other stack buttons
    <div className="relative h-11 w-11 shrink-0">
      <button
        type="button"
        className={`${controlBtnClass} absolute inset-0 ${open ? 'border-red-500 text-red-500' : 'text-gray-700'}`}
        data-control-position="topright"
        title={t('map.overseas')}
        aria-label={t('map.overseas')}
        aria-expanded={open}
        onClick={() => setOpenState(!open)}
      >
        <FaGlobe className="text-base" aria-hidden />
      </button>

      {open && (
        <div
          className="absolute right-full top-0 z-20 mr-2 w-72 max-w-[min(18rem,calc(100vw-4.5rem))] rounded-sm border-2 border-gray-300 bg-white shadow-md"
          role="dialog"
          aria-label={t('map.overseas')}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-bold text-red-600">{t('map.overseas')}</span>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label={t('common.close')}
              onClick={() => setOpenState(false)}
            >
              <FaXmark />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto overflow-x-hidden">
            {sections.map((section) => (
              <div key={section.code || 'unknown'}>
                <div className="sticky top-0 border-b border-gray-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {section.label}
                  {section.code ? (
                    <span className="ml-1 font-normal normal-case text-gray-400">({section.code})</span>
                  ) : null}
                </div>
                <ul className="m-0 list-none p-0">
                  {section.groups.map((group, idx) => {
                    const rep = group[0];
                    const label = i18n.language.startsWith('ja') ? rep.properties.nameJp : rep.properties.name;
                    const icon = rep.properties.icon;
                    const key = getGroupingKeyForFeature(rep, 6);
                    return (
                      <li key={`${section.code}-${key}-${idx}`}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-slate-50 hover:underline"
                          onClick={() => {
                            setOpenState(false);
                            onSelect(rep);
                          }}
                        >
                          {icon && (
                            <img src={resolveTrackAssetUrl(icon)} alt="" className="h-4 w-4 shrink-0 object-contain" />
                          )}
                          <span className="min-w-0 truncate">
                            {label}
                            {group.length > 1 && (
                              <span className="font-normal text-gray-500"> ({group.length})</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
