// Metadata for the currencies ExchangeRate-API serves. Symbol + flag drive the
// UI; `decimals` matters because JPY/KRW/VND etc. have no minor unit.
const RAW = `USD|US Dollar|$|US|2
EUR|Euro|€|EU|2
GBP|British Pound|£|GB|2
JPY|Japanese Yen|¥|JP|0
INR|Indian Rupee|₹|IN|2
AUD|Australian Dollar|A$|AU|2
CAD|Canadian Dollar|C$|CA|2
CHF|Swiss Franc|Fr|CH|2
CNY|Chinese Yuan|¥|CN|2
HKD|Hong Kong Dollar|HK$|HK|2
NZD|New Zealand Dollar|NZ$|NZ|2
SGD|Singapore Dollar|S$|SG|2
AED|UAE Dirham|د.إ|AE|2
SAR|Saudi Riyal|﷼|SA|2
KRW|South Korean Won|₩|KR|0
SEK|Swedish Krona|kr|SE|2
NOK|Norwegian Krone|kr|NO|2
DKK|Danish Krone|kr|DK|2
PLN|Polish Zloty|zł|PL|2
CZK|Czech Koruna|Kč|CZ|2
HUF|Hungarian Forint|Ft|HU|2
RON|Romanian Leu|lei|RO|2
TRY|Turkish Lira|₺|TR|2
RUB|Russian Ruble|₽|RU|2
BRL|Brazilian Real|R$|BR|2
MXN|Mexican Peso|Mex$|MX|2
ARS|Argentine Peso|$|AR|2
CLP|Chilean Peso|$|CL|0
COP|Colombian Peso|$|CO|2
PEN|Peruvian Sol|S/|PE|2
ZAR|South African Rand|R|ZA|2
NGN|Nigerian Naira|₦|NG|2
EGP|Egyptian Pound|E£|EG|2
KES|Kenyan Shilling|KSh|KE|2
GHS|Ghanaian Cedi|₵|GH|2
MAD|Moroccan Dirham|د.م.|MA|2
THB|Thai Baht|฿|TH|2
MYR|Malaysian Ringgit|RM|MY|2
IDR|Indonesian Rupiah|Rp|ID|2
PHP|Philippine Peso|₱|PH|2
VND|Vietnamese Dong|₫|VN|0
PKR|Pakistani Rupee|₨|PK|2
BDT|Bangladeshi Taka|৳|BD|2
LKR|Sri Lankan Rupee|Rs|LK|2
NPR|Nepalese Rupee|Rs|NP|2
ILS|Israeli Shekel|₪|IL|2
QAR|Qatari Riyal|﷼|QA|2
KWD|Kuwaiti Dinar|د.ك|KW|3
BHD|Bahraini Dinar|.د.ب|BH|3
OMR|Omani Rial|﷼|OM|3
JOD|Jordanian Dinar|د.ا|JO|3
ISK|Icelandic Krona|kr|IS|0
UAH|Ukrainian Hryvnia|₴|UA|2
TWD|Taiwan Dollar|NT$|TW|2
BGN|Bulgarian Lev|лв|BG|2
HRK|Croatian Kuna|kn|HR|2
RSD|Serbian Dinar|дин|RS|2
KZT|Kazakhstani Tenge|₸|KZ|2
UZS|Uzbekistani Som|so'm|UZ|2
ETB|Ethiopian Birr|Br|ET|2
TZS|Tanzanian Shilling|TSh|TZ|2
UGX|Ugandan Shilling|USh|UG|0
XAF|Central African Franc|FCFA|CM|0
XOF|West African Franc|CFA|SN|0
DZD|Algerian Dinar|د.ج|DZ|2
TND|Tunisian Dinar|د.ت|TN|3
JMD|Jamaican Dollar|J$|JM|2
TTD|Trinidad Dollar|TT$|TT|2
DOP|Dominican Peso|RD$|DO|2
GTQ|Guatemalan Quetzal|Q|GT|2
CRC|Costa Rican Colon|₡|CR|2
UYU|Uruguayan Peso|$U|UY|2
BOB|Bolivian Boliviano|Bs|BO|2
PYG|Paraguayan Guarani|₲|PY|0
MMK|Myanmar Kyat|K|MM|2
KHR|Cambodian Riel|៛|KH|2
LAK|Lao Kip|₭|LA|2
MNT|Mongolian Tugrik|₮|MN|2
BND|Brunei Dollar|B$|BN|2
MOP|Macanese Pataca|MOP$|MO|2
FJD|Fijian Dollar|FJ$|FJ|2
PGK|Papua New Guinean Kina|K|PG|2
XCD|East Caribbean Dollar|EC$|AG|2
BBD|Barbadian Dollar|Bds$|BB|2
BSD|Bahamian Dollar|B$|BS|2
BZD|Belize Dollar|BZ$|BZ|2
AWG|Aruban Florin|ƒ|AW|2
ANG|Neth. Antillean Guilder|ƒ|CW|2
HNL|Honduran Lempira|L|HN|2
NIO|Nicaraguan Cordoba|C$|NI|2
PAB|Panamanian Balboa|B/.|PA|2
AFN|Afghan Afghani|؋|AF|2
ALL|Albanian Lek|L|AL|2
AMD|Armenian Dram|֏|AM|2
AZN|Azerbaijani Manat|₼|AZ|2
BAM|Bosnia Marka|KM|BA|2
BWP|Botswana Pula|P|BW|2
BYN|Belarusian Ruble|Br|BY|2
CDF|Congolese Franc|FC|CD|2
CUP|Cuban Peso|₱|CU|2
DJF|Djiboutian Franc|Fdj|DJ|0
ERN|Eritrean Nakfa|Nfk|ER|2
GEL|Georgian Lari|₾|GE|2
GMD|Gambian Dalasi|D|GM|2
GNF|Guinean Franc|FG|GN|0
GYD|Guyanaese Dollar|G$|GY|2
HTG|Haitian Gourde|G|HT|2
IQD|Iraqi Dinar|ع.د|IQ|3
IRR|Iranian Rial|﷼|IR|2
KGS|Kyrgystani Som|с|KG|2
KMF|Comorian Franc|CF|KM|0
LBP|Lebanese Pound|ل.ل|LB|2
LRD|Liberian Dollar|L$|LR|2
LSL|Lesotho Loti|L|LS|2
LYD|Libyan Dinar|ل.د|LY|3
MDL|Moldovan Leu|L|MD|2
MGA|Malagasy Ariary|Ar|MG|2
MKD|Macedonian Denar|ден|MK|2
MRU|Mauritanian Ouguiya|UM|MR|2
MUR|Mauritian Rupee|₨|MU|2
MVR|Maldivian Rufiyaa|Rf|MV|2
MWK|Malawian Kwacha|MK|MW|2
MZN|Mozambican Metical|MT|MZ|2
NAD|Namibian Dollar|N$|NA|2
RWF|Rwandan Franc|FRw|RW|0
SBD|Solomon Islands Dollar|SI$|SB|2
SCR|Seychellois Rupee|₨|SC|2
SDG|Sudanese Pound|ج.س|SD|2
SLE|Sierra Leonean Leone|Le|SL|2
SOS|Somali Shilling|Sh|SO|2
SRD|Surinamese Dollar|$|SR|2
SSP|South Sudanese Pound|£|SS|2
STN|Sao Tome Dobra|Db|ST|2
SYP|Syrian Pound|£|SY|2
SZL|Swazi Lilangeni|E|SZ|2
TJS|Tajikistani Somoni|ЅМ|TJ|2
TMT|Turkmenistani Manat|m|TM|2
TOP|Tongan Paanga|T$|TO|2
VES|Venezuelan Bolivar|Bs.|VE|2
VUV|Vanuatu Vatu|VT|VU|0
WST|Samoan Tala|WS$|WS|2
XPF|CFP Franc|₣|PF|0
YER|Yemeni Rial|﷼|YE|2
ZMW|Zambian Kwacha|ZK|ZM|2
ZWL|Zimbabwean Dollar|Z$|ZW|2
KYD|Cayman Islands Dollar|CI$|KY|2
BMD|Bermudan Dollar|BD$|BM|2
GIP|Gibraltar Pound|£|GI|2
FKP|Falkland Islands Pound|£|FK|2
SHP|Saint Helena Pound|£|SH|2
JEP|Jersey Pound|£|JE|2
GGP|Guernsey Pound|£|GG|2
IMP|Isle of Man Pound|£|IM|2
CVE|Cape Verdean Escudo|$|CV|2
BIF|Burundian Franc|FBu|BI|0
CUC|Cuban Convertible Peso|$|CU|2
KPW|North Korean Won|₩|KP|2
BTN|Bhutanese Ngultrum|Nu.|BT|2
CLF|Chilean Unit of Account|UF|CL|4
XDR|IMF Special Drawing Rights|SDR|UN|2`;

// Regional-indicator flag emoji from an ISO country code.
const flag = (cc) =>
  cc && cc.length === 2 && /^[A-Z]{2}$/.test(cc)
    ? String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '🏳️';

export const CURRENCIES = RAW.split('\n').map((line) => {
  const [code, name, symbol, cc, decimals] = line.split('|');
  return { code, name, symbol, flag: flag(cc), decimals: Number(decimals) };
});

export const BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export const meta = (code) =>
  BY_CODE[code] || { code, name: code, symbol: code, flag: '🏳️', decimals: 2 };
