const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  IN: "Asia/Kolkata",
  US: "America/New_York",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  JP: "Asia/Tokyo",
  CN: "Asia/Shanghai",
  KR: "Asia/Seoul",
  SG: "Asia/Singapore",
  AU: "Australia/Sydney",
  CA: "America/Toronto",
  BR: "America/Sao_Paulo",
  RU: "Europe/Moscow",
  NL: "Europe/Amsterdam",
  CH: "Europe/Zurich",
  SE: "Europe/Stockholm",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  ZA: "Africa/Johannesburg",
  NG: "Africa/Lagos",
  EG: "Africa/Cairo",
  KE: "Africa/Nairobi",
  MX: "America/Mexico_City",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  NZ: "Pacific/Auckland",
  TH: "Asia/Bangkok",
  VN: "Asia/Ho_Chi_Minh",
  MY: "Asia/Kuala_Lumpur",
  ID: "Asia/Jakarta",
  PH: "Asia/Manila",
  TW: "Asia/Taipei",
  HK: "Asia/Hong_Kong",
  PK: "Asia/Karachi",
  BD: "Asia/Dhaka",
  LK: "Asia/Colombo",
  NP: "Asia/Kathmandu",
  CZ: "Europe/Prague",
  PL: "Europe/Warsaw",
  AT: "Europe/Vienna",
  PT: "Europe/Lisbon",
  GR: "Europe/Athens",
  TR: "Europe/Istanbul",
  UA: "Europe/Kyiv",
  FI: "Europe/Helsinki",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  BE: "Europe/Brussels",
};

const TIMEZONE_COUNTRY_MAP: Record<string, string> = {};
for (const [country, tz] of Object.entries(COUNTRY_TIMEZONE_MAP)) {
  TIMEZONE_COUNTRY_MAP[tz] = country;
}

export class TimezoneNormalizer {
  normalize(country: string, timezone?: string): string {
    if (timezone) return timezone;
    const upper = country.toUpperCase();
    return COUNTRY_TIMEZONE_MAP[upper] ?? "UTC";
  }

  getCountryFromTimezone(timezone: string): string {
    return TIMEZONE_COUNTRY_MAP[timezone] ?? "";
  }
}
