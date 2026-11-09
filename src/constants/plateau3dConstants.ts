/** Source Cooperative PLATEAU 3D Tiles (smartmaps/xing). See docs/features/3d-mode-plan.md */
export const XING_PLATEAU_DATA_BASE = 'https://data.source.coop/smartmaps/xing';

export const MAP_3D_STORAGE_KEY = 'chama-map-3d-mode';

export const PLATEAU_3D_MIN_ZOOM = 14;
export const PLATEAU_3D_MAX_ZOOM = 18;
export const MAP_3D_MAX_PITCH = 55;
export const MAP_3D_MOBILE_MAX_PITCH = 45;
export const MAP_3D_ENABLE_PITCH = 45;
export const PLATEAU_TILE_MOVE_DEBOUNCE_MS = 200;

const tileset = (path: string) => `${XING_PLATEAU_DATA_BASE}/${path}/tileset.json`;

/** Representative LOD1 building tileset per prefecture (`nam` from japan-prefectures.geojson). */
export const PLATEAU_XING_LOD1_BY_PREFECTURE: Record<string, string> = {
  'Hokkai Do': tileset('01100_sapporo-shi_city_2020_citygml_6_op_bldg_3dtiles_01101_chuo-ku_lod1'),
  'Aomori Ken': tileset('02208_mutsu-shi_city_2022_citygml_3_op_bldg_3dtiles_lod1'),
  'Fukushima Ken': tileset('07203_koriyama-shi_city_2020_citygml_8_op_bldg_3dtiles_lod1'),
  'Gunma Ken': tileset('10201_maebashi-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Saitama Ken': tileset('11100_saitama-shi_city_2023_citygml_1_op_bldg_3dtiles_11101_nishi-ku_lod1'),
  'Chiba Ken': tileset('12210_mobara-shi_city_2022_citygml_3_op_bldg_3dtiles_lod1'),
  'Tokyo To': tileset('13101_chiyoda-ku_pref_2023_citygml_1_op_bldg_3dtiles_13101_chiyoda-ku_lod1'),
  'Kanagawa Ken': tileset('14100_yokohama-shi_city_2023_citygml_1_op_bldg_3dtiles_14101_tsurumi-ku_lod1'),
  'Niigata Ken': tileset('15100_niigata-shi_city_2023_citygml_1_op_bldg_3dtiles_15101_kita-ku_lod1'),
  'Ishikawa Ken': tileset('17201_kanazawa-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Yamanashi Ken': tileset('19201_kofu-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Gifu Ken': tileset('21201_gifu-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Aichi Ken': tileset('23100_nagoya-shi_city_2022_citygml_3_op_bldg_3dtiles_23101_chikusa-ku_lod1'),
  'Mie Ken': tileset('24202_yokkaichi-shi_city_2022_citygml_3_op_bldg_3dtiles_lod1'),
  'Kyoto Fu': tileset('26100_kyoto-shi_city_2023_citygml_1_op_bldg_3dtiles_26101_kita-ku_lod1'),
  'Osaka Fu': tileset('27100_osaka-shi_city_2022_citygml_3_op_bldg_3dtiles_27102_miyakojima-ku_lod1'),
  'Wakayama Ken': tileset('30201_wakayama-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Tottori Ken': tileset('31201_tottori-shi_city_2020_citygml_6_op_bldg_3dtiles_lod1'),
  'Hiroshima Ken': tileset('34100_hirosima-shi_city_2022_citygml_3_op_bldg_3dtiles_34101_naka-ku_lod1'),
  'Tokushima Ken': tileset('36201_tokushima-shi_city_2023_citygml_1_op_bldg_3dtiles_lod1'),
  'Fukuoka Ken': tileset('40100_kitakyushu-shi_city_2020_citygml_6_op_bldg_3dtiles_40101_moji-ku_lod1'),
  'Saga Ken': tileset('41206_takeo-shi_city_2022_citygml_3_op_bldg_3dtiles_lod1'),
  'Kumamoto Ken': tileset('43100_kumamoto-shi_city_2022_citygml_3_op_bldg_3dtiles_43101_chuo-ku_lod1'),
  'Oita Ken': tileset('44204_hita-shi_city_2020_citygml_6_op_bldg_3dtiles_lod1'),
  'Miyazaki Ken': tileset('45203_nobeoka-shi_city_2022_citygml_3_op_bldg_3dtiles_lod1'),
  'Okinawa Ken': tileset('47201_naha-shi_city_2020_citygml_6_op_bldg_3dtiles_lod1'),
};

export const PLATEAU_XING_INFO_URL = 'https://source.coop/smartmaps/xing';
export const PLATEAU_POLICY_URL = 'https://www.mlit.go.jp/plateau/site-policy/';
