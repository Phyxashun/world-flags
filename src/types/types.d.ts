export interface CountryData {
  code: string;
  name: string;
}
export interface FlagData {
  countryCode: string;
  countryName: string;
  blob: Blob;
  objectURL: string;
}
export interface FetchedData {
  countryCode: string;
  countryName: string;
  blob: Blob;
}
