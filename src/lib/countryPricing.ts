export type ProductType = "premium" | "pro" | "b2b";

export interface CountryPricing {
  countryCode: string;
  country: string;
  currency: string;
  premium: number;
  pro: number;
  b2b: number;
  usdApprox: number;
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

const STRIPE_SUPPORTED_CURRENCIES = new Set([
  "AED", "AUD", "BAM", "BBD", "BDT", "BGN", "BND", "BOB", "BRL", "BWP", "CAD", "CHF", "CLP", "CNY", "COP", "CRC", "CZK",
  "DKK", "DOP", "DZD", "EGP", "ETB", "EUR", "FJD", "GBP", "GEL", "GHS", "GTQ", "GYD", "HKD", "HNL", "HRK", "HUF", "IDR",
  "ILS", "INR", "ISK", "JMD", "JPY", "KES", "KRW", "KZT", "LAK", "LKR", "MAD", "MDL", "MNT", "MUR", "MXN", "MYR", "NAD",
  "NGN", "NOK", "NPR", "NZD", "OMR", "PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "SAR", "SCR", "SEK",
  "SGD", "THB", "TND", "TRY", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "VND", "XAF", "XOF", "ZAR", "ZMW",
]);

export const COUNTRY_PRICING_BY_CODE: Record<string, CountryPricing> = {
  AF: { countryCode: "AF", country: "Afghanistan", currency: "AFN", premium: 350, pro: 900, b2b: 350, usdApprox: 4 },
  AL: { countryCode: "AL", country: "Albania", currency: "ALL", premium: 1600, pro: 4000, b2b: 1700, usdApprox: 18 },
  DZ: { countryCode: "DZ", country: "Algeria", currency: "DZD", premium: 1200, pro: 3200, b2b: 1300, usdApprox: 9 },
  AD: { countryCode: "AD", country: "Andorra", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  AO: { countryCode: "AO", country: "Angola", currency: "AOA", premium: 3800, pro: 9800, b2b: 4000, usdApprox: 7 },
  AG: { countryCode: "AG", country: "Antigua & Barbuda", currency: "XCD", premium: 45, pro: 120, b2b: 50, usdApprox: 18 },
  AR: { countryCode: "AR", country: "Argentina", currency: "ARS", premium: 6500, pro: 17000, b2b: 7000, usdApprox: 7 },
  AM: { countryCode: "AM", country: "Armenia", currency: "AMD", premium: 2400, pro: 6200, b2b: 2600, usdApprox: 6 },
  AU: { countryCode: "AU", country: "Australia", currency: "AUD", premium: 29, pro: 75, b2b: 30, usdApprox: 20 },
  AT: { countryCode: "AT", country: "Austria", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  AZ: { countryCode: "AZ", country: "Azerbaijan", currency: "AZN", premium: 12, pro: 32, b2b: 13, usdApprox: 8 },
  BS: { countryCode: "BS", country: "Bahamas", currency: "BSD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  BH: { countryCode: "BH", country: "Bahrain", currency: "BHD", premium: 5.5, pro: 14, b2b: 6, usdApprox: 16 },
  BD: { countryCode: "BD", country: "Bangladesh", currency: "BDT", premium: 550, pro: 1400, b2b: 600, usdApprox: 5.5 },
  BB: { countryCode: "BB", country: "Barbados", currency: "BBD", premium: 38, pro: 98, b2b: 40, usdApprox: 20 },
  BY: { countryCode: "BY", country: "Belarus", currency: "BYN", premium: 25, pro: 65, b2b: 27, usdApprox: 8 },
  BE: { countryCode: "BE", country: "Belgium", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  BZ: { countryCode: "BZ", country: "Belize", currency: "BZD", premium: 38, pro: 98, b2b: 40, usdApprox: 20 },
  BJ: { countryCode: "BJ", country: "Benin", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  BT: { countryCode: "BT", country: "Bhutan", currency: "BTN", premium: 499, pro: 1299, b2b: 599, usdApprox: 7 },
  BO: { countryCode: "BO", country: "Bolivia", currency: "BOB", premium: 45, pro: 120, b2b: 48, usdApprox: 7 },
  BA: { countryCode: "BA", country: "Bosnia & Herzegovina", currency: "BAM", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  BW: { countryCode: "BW", country: "Botswana", currency: "BWP", premium: 95, pro: 250, b2b: 105, usdApprox: 8 },
  BR: { countryCode: "BR", country: "Brazil", currency: "BRL", premium: 39, pro: 99, b2b: 45, usdApprox: 9 },
  BN: { countryCode: "BN", country: "Brunei", currency: "BND", premium: 18, pro: 48, b2b: 20, usdApprox: 15 },
  BG: { countryCode: "BG", country: "Bulgaria", currency: "BGN", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  BF: { countryCode: "BF", country: "Burkina Faso", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  BI: { countryCode: "BI", country: "Burundi", currency: "BIF", premium: 8000, pro: 20000, b2b: 8500, usdApprox: 4 },
  KH: { countryCode: "KH", country: "Cambodia", currency: "KHR", premium: 25000, pro: 65000, b2b: 28000, usdApprox: 7 },
  CM: { countryCode: "CM", country: "Cameroon", currency: "XAF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  CA: { countryCode: "CA", country: "Canada", currency: "CAD", premium: 25, pro: 65, b2b: 27, usdApprox: 20 },
  CV: { countryCode: "CV", country: "Cape Verde", currency: "CVE", premium: 1600, pro: 4200, b2b: 1700, usdApprox: 17 },
  CF: { countryCode: "CF", country: "Central African Republic", currency: "XAF", premium: 2500, pro: 6000, b2b: 2700, usdApprox: 4 },
  TD: { countryCode: "TD", country: "Chad", currency: "XAF", premium: 2500, pro: 6000, b2b: 2700, usdApprox: 4 },
  CL: { countryCode: "CL", country: "Chile", currency: "CLP", premium: 15000, pro: 39000, b2b: 17000, usdApprox: 18 },
  CN: { countryCode: "CN", country: "China", currency: "CNY", premium: 129, pro: 349, b2b: 139, usdApprox: 19 },
  CO: { countryCode: "CO", country: "Colombia", currency: "COP", premium: 75000, pro: 199000, b2b: 85000, usdApprox: 7 },
  KM: { countryCode: "KM", country: "Comoros", currency: "KMF", premium: 3500, pro: 9000, b2b: 3800, usdApprox: 8 },
  CD: { countryCode: "CD", country: "Congo (DRC)", currency: "CDF", premium: 9000, pro: 22000, b2b: 9500, usdApprox: 4 },
  CG: { countryCode: "CG", country: "Congo (Republic)", currency: "XAF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  CR: { countryCode: "CR", country: "Costa Rica", currency: "CRC", premium: 10000, pro: 25000, b2b: 11000, usdApprox: 20 },
  HR: { countryCode: "HR", country: "Croatia", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  CU: { countryCode: "CU", country: "Cuba", currency: "CUP", premium: 450, pro: 1200, b2b: 500, usdApprox: 4 },
  CY: { countryCode: "CY", country: "Cyprus", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  CZ: { countryCode: "CZ", country: "Czech Republic", currency: "CZK", premium: 399, pro: 1050, b2b: 420, usdApprox: 18 },
  DK: { countryCode: "DK", country: "Denmark", currency: "DKK", premium: 129, pro: 349, b2b: 139, usdApprox: 20 },
  DJ: { countryCode: "DJ", country: "Djibouti", currency: "DJF", premium: 2400, pro: 6200, b2b: 2600, usdApprox: 15 },
  DM: { countryCode: "DM", country: "Dominica", currency: "XCD", premium: 45, pro: 120, b2b: 50, usdApprox: 18 },
  DO: { countryCode: "DO", country: "Dominican Republic", currency: "DOP", premium: 850, pro: 2200, b2b: 900, usdApprox: 15 },
  EC: { countryCode: "EC", country: "Ecuador", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  EG: { countryCode: "EG", country: "Egypt", currency: "EGP", premium: 599, pro: 1599, b2b: 650, usdApprox: 13 },
  SV: { countryCode: "SV", country: "El Salvador", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  GQ: { countryCode: "GQ", country: "Equatorial Guinea", currency: "XAF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  ER: { countryCode: "ER", country: "Eritrea", currency: "ERN", premium: 60, pro: 150, b2b: 65, usdApprox: 4 },
  EE: { countryCode: "EE", country: "Estonia", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  SZ: { countryCode: "SZ", country: "Eswatini", currency: "SZL", premium: 149, pro: 399, b2b: 169, usdApprox: 9 },
  ET: { countryCode: "ET", country: "Ethiopia", currency: "ETB", premium: 450, pro: 1200, b2b: 480, usdApprox: 8 },
  FJ: { countryCode: "FJ", country: "Fiji", currency: "FJD", premium: 19, pro: 49, b2b: 20, usdApprox: 9 },
  FI: { countryCode: "FI", country: "Finland", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  FR: { countryCode: "FR", country: "France", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  GA: { countryCode: "GA", country: "Gabon", currency: "XAF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  GM: { countryCode: "GM", country: "Gambia", currency: "GMD", premium: 399, pro: 999, b2b: 420, usdApprox: 6 },
  GE: { countryCode: "GE", country: "Georgia", currency: "GEL", premium: 45, pro: 120, b2b: 48, usdApprox: 18 },
  DE: { countryCode: "DE", country: "Germany", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  GH: { countryCode: "GH", country: "Ghana", currency: "GHS", premium: 120, pro: 320, b2b: 130, usdApprox: 11 },
  GR: { countryCode: "GR", country: "Greece", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  GD: { countryCode: "GD", country: "Grenada", currency: "XCD", premium: 45, pro: 120, b2b: 50, usdApprox: 18 },
  GT: { countryCode: "GT", country: "Guatemala", currency: "GTQ", premium: 120, pro: 320, b2b: 130, usdApprox: 17 },
  GN: { countryCode: "GN", country: "Guinea", currency: "GNF", premium: 35000, pro: 90000, b2b: 38000, usdApprox: 4 },
  GW: { countryCode: "GW", country: "Guinea-Bissau", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  GY: { countryCode: "GY", country: "Guyana", currency: "GYD", premium: 3900, pro: 9900, b2b: 4200, usdApprox: 20 },
  HT: { countryCode: "HT", country: "Haiti", currency: "HTG", premium: 500, pro: 1200, b2b: 550, usdApprox: 4 },
  HN: { countryCode: "HN", country: "Honduras", currency: "HNL", premium: 149, pro: 399, b2b: 169, usdApprox: 7 },
  HU: { countryCode: "HU", country: "Hungary", currency: "HUF", premium: 6500, pro: 17000, b2b: 7000, usdApprox: 20 },
  IS: { countryCode: "IS", country: "Iceland", currency: "ISK", premium: 2700, pro: 7000, b2b: 2900, usdApprox: 20 },
  IN: { countryCode: "IN", country: "India", currency: "INR", premium: 499, pro: 1299, b2b: 599, usdApprox: 7 },
  ID: { countryCode: "ID", country: "Indonesia", currency: "IDR", premium: 75000, pro: 199000, b2b: 89000, usdApprox: 6 },
  IR: { countryCode: "IR", country: "Iran", currency: "IRR", premium: 800000, pro: 2000000, b2b: 850000, usdApprox: 5 },
  IQ: { countryCode: "IQ", country: "Iraq", currency: "IQD", premium: 8000, pro: 20000, b2b: 9000, usdApprox: 7 },
  IE: { countryCode: "IE", country: "Ireland", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  IL: { countryCode: "IL", country: "Israel", currency: "ILS", premium: 55, pro: 145, b2b: 60, usdApprox: 16 },
  IT: { countryCode: "IT", country: "Italy", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  JM: { countryCode: "JM", country: "Jamaica", currency: "JMD", premium: 2900, pro: 7500, b2b: 3200, usdApprox: 20 },
  JP: { countryCode: "JP", country: "Japan", currency: "JPY", premium: 2200, pro: 5500, b2b: 2300, usdApprox: 15 },
  JO: { countryCode: "JO", country: "Jordan", currency: "JOD", premium: 10, pro: 26, b2b: 11, usdApprox: 15 },
  KZ: { countryCode: "KZ", country: "Kazakhstan", currency: "KZT", premium: 2700, pro: 7000, b2b: 2900, usdApprox: 6 },
  KE: { countryCode: "KE", country: "Kenya", currency: "KES", premium: 750, pro: 1999, b2b: 850, usdApprox: 6 },
  KI: { countryCode: "KI", country: "Kiribati", currency: "AUD", premium: 29, pro: 75, b2b: 30, usdApprox: 20 },
  KW: { countryCode: "KW", country: "Kuwait", currency: "KWD", premium: 6, pro: 16, b2b: 6.5, usdApprox: 21 },
  KG: { countryCode: "KG", country: "Kyrgyzstan", currency: "KGS", premium: 450, pro: 1200, b2b: 500, usdApprox: 6 },
  LA: { countryCode: "LA", country: "Laos", currency: "LAK", premium: 120000, pro: 299000, b2b: 130000, usdApprox: 6 },
  LV: { countryCode: "LV", country: "Latvia", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  LB: { countryCode: "LB", country: "Lebanon", currency: "LBP", premium: 1700000, pro: 4200000, b2b: 1900000, usdApprox: 20 },
  LS: { countryCode: "LS", country: "Lesotho", currency: "LSL", premium: 149, pro: 399, b2b: 169, usdApprox: 9 },
  LR: { countryCode: "LR", country: "Liberia", currency: "LRD", premium: 450, pro: 1200, b2b: 500, usdApprox: 4 },
  LY: { countryCode: "LY", country: "Libya", currency: "LYD", premium: 25, pro: 65, b2b: 27, usdApprox: 6 },
  LI: { countryCode: "LI", country: "Liechtenstein", currency: "CHF", premium: 19, pro: 49, b2b: 20, usdApprox: 22 },
  LT: { countryCode: "LT", country: "Lithuania", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  LU: { countryCode: "LU", country: "Luxembourg", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  MG: { countryCode: "MG", country: "Madagascar", currency: "MGA", premium: 25000, pro: 65000, b2b: 28000, usdApprox: 6 },
  MW: { countryCode: "MW", country: "Malawi", currency: "MWK", premium: 12000, pro: 30000, b2b: 13000, usdApprox: 7 },
  MY: { countryCode: "MY", country: "Malaysia", currency: "MYR", premium: 59, pro: 159, b2b: 65, usdApprox: 14 },
  MV: { countryCode: "MV", country: "Maldives", currency: "MVR", premium: 299, pro: 799, b2b: 330, usdApprox: 21 },
  ML: { countryCode: "ML", country: "Mali", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  MT: { countryCode: "MT", country: "Malta", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  MH: { countryCode: "MH", country: "Marshall Islands", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  MR: { countryCode: "MR", country: "Mauritania", currency: "MRU", premium: 150, pro: 399, b2b: 169, usdApprox: 5 },
  MU: { countryCode: "MU", country: "Mauritius", currency: "MUR", premium: 699, pro: 1799, b2b: 750, usdApprox: 16 },
  MX: { countryCode: "MX", country: "Mexico", currency: "MXN", premium: 179, pro: 449, b2b: 199, usdApprox: 12 },
  FM: { countryCode: "FM", country: "Micronesia", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  MD: { countryCode: "MD", country: "Moldova", currency: "MDL", premium: 299, pro: 799, b2b: 330, usdApprox: 18 },
  MC: { countryCode: "MC", country: "Monaco", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  MN: { countryCode: "MN", country: "Mongolia", currency: "MNT", premium: 19000, pro: 49000, b2b: 21000, usdApprox: 6 },
  ME: { countryCode: "ME", country: "Montenegro", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  MA: { countryCode: "MA", country: "Morocco", currency: "MAD", premium: 99, pro: 259, b2b: 109, usdApprox: 11 },
  MZ: { countryCode: "MZ", country: "Mozambique", currency: "MZN", premium: 299, pro: 799, b2b: 330, usdApprox: 5 },
  MM: { countryCode: "MM", country: "Myanmar", currency: "MMK", premium: 12000, pro: 30000, b2b: 13000, usdApprox: 6 },
  NA: { countryCode: "NA", country: "Namibia", currency: "NAD", premium: 149, pro: 399, b2b: 169, usdApprox: 9 },
  NP: { countryCode: "NP", country: "Nepal", currency: "NPR", premium: 499, pro: 1299, b2b: 599, usdApprox: 7 },
  NL: { countryCode: "NL", country: "Netherlands", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  NZ: { countryCode: "NZ", country: "New Zealand", currency: "NZD", premium: 29, pro: 75, b2b: 30, usdApprox: 18 },
  NI: { countryCode: "NI", country: "Nicaragua", currency: "NIO", premium: 149, pro: 399, b2b: 169, usdApprox: 5 },
  NE: { countryCode: "NE", country: "Niger", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  NG: { countryCode: "NG", country: "Nigeria", currency: "NGN", premium: 7500, pro: 19000, b2b: 8500, usdApprox: 6 },
  MK: { countryCode: "MK", country: "North Macedonia", currency: "MKD", premium: 299, pro: 799, b2b: 330, usdApprox: 18 },
  NO: { countryCode: "NO", country: "Norway", currency: "NOK", premium: 199, pro: 549, b2b: 219, usdApprox: 20 },
  OM: { countryCode: "OM", country: "Oman", currency: "OMR", premium: 7, pro: 18, b2b: 7.5, usdApprox: 19 },
  PK: { countryCode: "PK", country: "Pakistan", currency: "PKR", premium: 799, pro: 1999, b2b: 850, usdApprox: 5 },
  PA: { countryCode: "PA", country: "Panama", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  PG: { countryCode: "PG", country: "Papua New Guinea", currency: "PGK", premium: 49, pro: 129, b2b: 55, usdApprox: 14 },
  PY: { countryCode: "PY", country: "Paraguay", currency: "PYG", premium: 120000, pro: 320000, b2b: 130000, usdApprox: 18 },
  PE: { countryCode: "PE", country: "Peru", currency: "PEN", premium: 29, pro: 79, b2b: 32, usdApprox: 9 },
  PH: { countryCode: "PH", country: "Philippines", currency: "PHP", premium: 299, pro: 799, b2b: 349, usdApprox: 6 },
  PL: { countryCode: "PL", country: "Poland", currency: "PLN", premium: 79, pro: 199, b2b: 85, usdApprox: 21 },
  PT: { countryCode: "PT", country: "Portugal", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  QA: { countryCode: "QA", country: "Qatar", currency: "QAR", premium: 55, pro: 145, b2b: 60, usdApprox: 16 },
  RO: { countryCode: "RO", country: "Romania", currency: "RON", premium: 79, pro: 199, b2b: 85, usdApprox: 18 },
  RW: { countryCode: "RW", country: "Rwanda", currency: "RWF", premium: 5500, pro: 14000, b2b: 6000, usdApprox: 5 },
  RU: { countryCode: "RU", country: "Russia", currency: "RUB", premium: 1299, pro: 3499, b2b: 1399, usdApprox: 15 },
  SA: { countryCode: "SA", country: "Saudi Arabia", currency: "SAR", premium: 55, pro: 145, b2b: 55, usdApprox: 15 },
  SN: { countryCode: "SN", country: "Senegal", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  RS: { countryCode: "RS", country: "Serbia", currency: "RSD", premium: 1799, pro: 4699, b2b: 1900, usdApprox: 18 },
  SC: { countryCode: "SC", country: "Seychelles", currency: "SCR", premium: 249, pro: 649, b2b: 275, usdApprox: 20 },
  SL: { countryCode: "SL", country: "Sierra Leone", currency: "SLL", premium: 18000, pro: 45000, b2b: 20000, usdApprox: 4 },
  SG: { countryCode: "SG", country: "Singapore", currency: "SGD", premium: 18, pro: 48, b2b: 20, usdApprox: 15 },
  SK: { countryCode: "SK", country: "Slovakia", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  SI: { countryCode: "SI", country: "Slovenia", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  ZA: { countryCode: "ZA", country: "South Africa", currency: "ZAR", premium: 149, pro: 399, b2b: 169, usdApprox: 9 },
  KR: { countryCode: "KR", country: "South Korea", currency: "KRW", premium: 25000, pro: 65000, b2b: 27000, usdApprox: 20 },
  ES: { countryCode: "ES", country: "Spain", currency: "EUR", premium: 17, pro: 45, b2b: 18, usdApprox: 20 },
  LK: { countryCode: "LK", country: "Sri Lanka", currency: "LKR", premium: 1200, pro: 3200, b2b: 1300, usdApprox: 6 },
  SD: { countryCode: "SD", country: "Sudan", currency: "SDG", premium: 4500, pro: 12000, b2b: 5000, usdApprox: 4 },
  SR: { countryCode: "SR", country: "Suriname", currency: "SRD", premium: 120, pro: 320, b2b: 130, usdApprox: 5 },
  SE: { countryCode: "SE", country: "Sweden", currency: "SEK", premium: 199, pro: 549, b2b: 219, usdApprox: 20 },
  CH: { countryCode: "CH", country: "Switzerland", currency: "CHF", premium: 19, pro: 49, b2b: 20, usdApprox: 22 },
  TW: { countryCode: "TW", country: "Taiwan", currency: "TWD", premium: 599, pro: 1599, b2b: 650, usdApprox: 20 },
  TZ: { countryCode: "TZ", country: "Tanzania", currency: "TZS", premium: 8500, pro: 22000, b2b: 9500, usdApprox: 4 },
  TH: { countryCode: "TH", country: "Thailand", currency: "THB", premium: 199, pro: 549, b2b: 219, usdApprox: 6 },
  TG: { countryCode: "TG", country: "Togo", currency: "XOF", premium: 3000, pro: 7500, b2b: 3200, usdApprox: 5 },
  TN: { countryCode: "TN", country: "Tunisia", currency: "TND", premium: 25, pro: 65, b2b: 27, usdApprox: 8 },
  TR: { countryCode: "TR", country: "Turkey", currency: "TRY", premium: 399, pro: 1099, b2b: 449, usdApprox: 14 },
  UG: { countryCode: "UG", country: "Uganda", currency: "UGX", premium: 25000, pro: 65000, b2b: 28000, usdApprox: 7 },
  UA: { countryCode: "UA", country: "Ukraine", currency: "UAH", premium: 499, pro: 1299, b2b: 549, usdApprox: 15 },
  AE: { countryCode: "AE", country: "United Arab Emirates", currency: "AED", premium: 55, pro: 145, b2b: 55, usdApprox: 15 },
  GB: { countryCode: "GB", country: "United Kingdom", currency: "GBP", premium: 15, pro: 39, b2b: 16, usdApprox: 20 },
  US: { countryCode: "US", country: "United States", currency: "USD", premium: 19, pro: 49, b2b: 20, usdApprox: 20 },
  UY: { countryCode: "UY", country: "Uruguay", currency: "UYU", premium: 499, pro: 1299, b2b: 549, usdApprox: 14 },
  VE: { countryCode: "VE", country: "Venezuela", currency: "VES", premium: 250, pro: 650, b2b: 275, usdApprox: 8 },
  VN: { countryCode: "VN", country: "Vietnam", currency: "VND", premium: 149000, pro: 399000, b2b: 169000, usdApprox: 7 },
  YE: { countryCode: "YE", country: "Yemen", currency: "YER", premium: 3500, pro: 9000, b2b: 3800, usdApprox: 4 },
  ZM: { countryCode: "ZM", country: "Zambia", currency: "ZMW", premium: 149, pro: 399, b2b: 169, usdApprox: 8 },
  ZW: { countryCode: "ZW", country: "Zimbabwe", currency: "ZWL", premium: 6500, pro: 17000, b2b: 7000, usdApprox: 7 },
};

export function getCountryPricing(countryCode?: string): CountryPricing {
  const code = (countryCode || "US").toUpperCase();
  return COUNTRY_PRICING_BY_CODE[code] || COUNTRY_PRICING_BY_CODE.US;
}

function toMinorUnits(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(amount);
  if (THREE_DECIMAL_CURRENCIES.has(code)) return Math.round(amount * 1000);
  return Math.round(amount * 100);
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: THREE_DECIMAL_CURRENCIES.has(currency) ? 3 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function getLocalizedPrice(productType: ProductType, countryCode?: string) {
  const pricing = getCountryPricing(countryCode);
  const localAmount = pricing[productType];
  const localCurrency = pricing.currency.toUpperCase();
  const canUseLocalCurrencyInStripe = STRIPE_SUPPORTED_CURRENCIES.has(localCurrency);

  if (canUseLocalCurrencyInStripe) {
    return {
      countryCode: pricing.countryCode,
      country: pricing.country,
      displayCurrency: localCurrency,
      displayAmount: localAmount,
      displayFormatted: formatCurrency(localAmount, localCurrency),
      stripeCurrency: localCurrency.toLowerCase(),
      stripeAmountMinor: toMinorUnits(localAmount, localCurrency),
      fallbackToUsd: false,
    };
  }

  const usdEquivalent =
    productType === "b2b"
      ? pricing.usdApprox
      : (localAmount / pricing.b2b) * pricing.usdApprox;

  return {
    countryCode: pricing.countryCode,
    country: pricing.country,
    displayCurrency: localCurrency,
    displayAmount: localAmount,
    displayFormatted: formatCurrency(localAmount, localCurrency),
    stripeCurrency: "usd",
    stripeAmountMinor: Math.round(usdEquivalent * 100),
    fallbackToUsd: true,
    usdEquivalent,
  };
}

export function convertUsdToLocalB2B(usdAmount: number, countryCode?: string): {
  amountLocal: number;
  currency: string;
  country: string;
} {
  const pricing = getCountryPricing(countryCode);
  const safeUsd = Number.isFinite(usdAmount) ? Math.max(0, usdAmount) : 0;
  const conversionRate = pricing.usdApprox > 0 ? pricing.b2b / pricing.usdApprox : 1;
  const localizedAmount = safeUsd * conversionRate;

  const roundedAmount = THREE_DECIMAL_CURRENCIES.has(pricing.currency)
    ? Math.round(localizedAmount * 1000) / 1000
    : ZERO_DECIMAL_CURRENCIES.has(pricing.currency)
      ? Math.round(localizedAmount)
      : Math.round(localizedAmount * 100) / 100;

  return {
    amountLocal: roundedAmount,
    currency: pricing.currency,
    country: pricing.country,
  };
}

export async function detectCountryCode(): Promise<string> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = (await response.json()) as { country_code?: string };
      if (data.country_code && data.country_code.length === 2) {
        return data.country_code.toUpperCase();
      }
    }
  } catch {
    // fall through to locale-based fallback
  }

  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const localeCountry = locale.split("-")[1];
  if (localeCountry && localeCountry.length === 2) {
    return localeCountry.toUpperCase();
  }

  return "US";
}