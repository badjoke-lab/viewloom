import type { CityCentroidRecord } from './city-centroid-core'

export type CityCentroidReference = CityCentroidRecord & {
  source: 'openstreetmap-reference-point'
  sourceUrl: string
}

// Initial City marker coverage for City-level locations already present in the
// reviewed Twitch evidence set. These are city/place reference points, never
// creator coordinates. Missing or ambiguous cities remain unplaced.
export const TWITCH_CITY_CENTROIDS_INITIAL: CityCentroidReference[] = [
  {
    countryCode: 'US',
    region: 'Texas',
    city: 'Dallas',
    longitude: -96.7977,
    latitude: 32.7815,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Dallas,_Texas',
  },
  {
    countryCode: 'ES',
    region: 'Catalonia',
    city: 'Sant Cugat del Valles',
    aliases: ['Sant Cugat del Vallès'],
    longitude: 2.082139,
    latitude: 41.471864,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Sant_Cugat_del_Vall%C3%A8s',
  },
  {
    countryCode: 'DE',
    region: 'North Rhine-Westphalia',
    city: 'Cologne',
    aliases: ['Köln'],
    longitude: 6.958976,
    latitude: 50.94257,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Cologne',
  },
  {
    countryCode: 'US',
    region: 'Florida',
    city: 'Miami',
    longitude: -80.19,
    latitude: 25.77,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Miami,_Florida',
  },
  {
    countryCode: 'US',
    region: 'California',
    city: 'Los Angeles',
    longitude: -118.25,
    latitude: 34.05,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Los_Angeles,_California',
  },
  {
    countryCode: 'US',
    region: 'Texas',
    city: 'Austin',
    longitude: -97.74306,
    latitude: 30.26722,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Austin,_Texas',
  },
  {
    countryCode: 'DE',
    region: 'Berlin',
    city: 'Berlin',
    longitude: 13.40185,
    latitude: 52.52564,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Berlin',
  },
  {
    countryCode: 'RU',
    region: 'Moscow',
    city: 'Moscow',
    longitude: 37.617,
    latitude: 55.775,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Moscow',
  },
  {
    countryCode: 'JP',
    region: 'Tokyo',
    city: 'Tokyo',
    longitude: 139.76,
    latitude: 35.68,
    source: 'openstreetmap-reference-point',
    sourceUrl: 'https://wiki.openstreetmap.org/wiki/Tokyo',
  },
]
