# india-festival-dates

Indian festival dates, calculated. Give it a year and a place. It gives you
the local dates of Diwali, Holi, Navratri, Onam, Pongal and about 75 other
festivals and days.

Nothing is looked up. The library works out the Sun and the Moon with
[astronomy-engine](https://github.com/cosinekitty/astronomy), builds a small
panchang (tithi, nakshatra, lunar months, sankrantis), and applies each
festival's written rule. So it works for any year, and for any city.

## Install

```sh
npm install india-festival-dates
```

Node 20 or later, or any modern browser. ESM only. Types included.

## Quick start

```js
import { festivalDays, festivalsInYear, panchang } from 'india-festival-dates';

festivalDays('diwali', 2027, 'london');
// [{ first: '2027-10-27', last: '2027-10-30', parts: [
//    { name: 'Dhanteras', date: '2027-10-27' }, { name: 'Lakshmi Puja', … }, … ] }]

festivalDays('janmashtami', 2026, 'vancouver');
// [{ first: '2026-09-03', last: '2026-09-03', vaishnava: '2026-09-04' }]

const bengaluru = { latitude: 12.97, longitude: 77.59, timeZone: 'Asia/Kolkata', country: 'IN' };
festivalsInYear(2030, bengaluru); // every festival in 2030, in date order

panchang('2026-11-08', 'new-delhi');
// { tithi: { number: 29, name: 'Krishna Chaturdashi', ends: … }, nakshatra: …, month: … }
```

Dates are local calendar days (`YYYY-MM-DD`) at the place you pass.

## API

### `festivalDays(id, year, place)`

The observances of one festival whose first day falls in `year`. Returns
an array. It usually has one item. A festival of the lunar year can fall
twice in one Gregorian year, or not at all (Guru Gobind Singh Jayanti in
2028 and 2026). Country-specific days are empty where they are not kept.

Each item is:

| Field       | Meaning                                                              |
| ----------- | -------------------------------------------------------------------- |
| `first`     | First day, `YYYY-MM-DD`.                                             |
| `last`      | Last day. The same as `first` for a one-day festival.                |
| `vaishnava` | The Vaishnava (ISKCON) day, for Janmashtami and Rama Navami.         |
| `parts`     | Named days inside a longer festival (Diwali, Chhath Puja, Onam).    |

### `festivalsInYear(year, place)`

Every supported festival in a year, sorted by date. Each item also has
`id` and `name`.

### `festivalsOn(date, place)`

The festivals that include a given day.

### `panchang(date, place)`

The day's panchang at sunrise: sunrise, sunset and moonrise (UTC
milliseconds), the tithi and nakshatra with the time each ends, the amanta
and purnimanta month (and whether it is adhik), and the Sun's sign.

### `FESTIVALS`, `getFestival(id)`, `NOT_SUPPORTED`

The festival definitions: `id`, `name`, `tradition` and `rule` (in plain
words). `NOT_SUPPORTED` lists what the library leaves out, and why.

### Lower-level helpers

`sunrise`, `sunset`, `moonrise`, `sunSidereal`, `moonSidereal`,
`lahiriAyanamsa`, `tithiAt`, `nakshatraAt`, `sunRashiAt`, `sankranti`,
`lunarMonthsAround`, `easterSunday`, `chineseNewYear`, `iranianNowruz`,
`shahenshahiNavroz`, and the name lists `MONTHS`, `TITHIS`, `NAKSHATRAS`,
`RASHIS`. Instants are UTC milliseconds.

## Places

A place is either a preset name or a location object:

```ts
interface Location {
  latitude: number;   // degrees north
  longitude: number;  // degrees east
  timeZone: string;   // IANA zone, e.g. 'Asia/Kolkata'
  elevation?: number; // metres
  country?: string;   // ISO code; only for Mother's Day, Father's Day, Thanksgiving, Grandparents' Day
  name?: string;
}
```

Presets (`PRESETS`): `new-delhi`, `toronto`, `vancouver`, `london`,
`dubai`, `singapore`, `sydney`.

The place matters. A tithi is read at the local sunrise, sunset, midday or
midnight, so the same festival can fall a day apart in Delhi and in
Vancouver.

## How it works

- **Sun and Moon.** Positions, sunrise, sunset and moonrise come from
  astronomy-engine. Sunrise is the upper limb on the horizon with standard
  refraction.
- **Ayanamsa.** Lahiri (Chitrapaksha), as fixed by the Calendar Reform
  Committee: 23°15'00.658" on 21 March 1956, carried by the IAU 2006
  precession.
- **Tithi.** The Moon's lead over the Sun, in steps of 12°. Tithis 1–15 are
  Shukla (15 is Purnima), 16–30 are Krishna (30 is Amavasya).
- **Nakshatra.** The Moon's sidereal longitude, in steps of 13°20'.
- **Lunar months.** Amanta: new moon to new moon. A month is named after
  the sign the Sun enters during it (Mesha: Chaitra). A month with no
  sankranti is adhik. The purnimanta name of a Krishna paksha day is the
  next month's.
- **Solar months.** A sankranti is the Sun entering a sidereal sign. Each
  region starts its month on its own day: Tamil (before sunset, that day),
  Malayalam (before the end of madhyahna, that day), Bengali and Assamese
  (the next day), Punjab (the day itself).
- **Parts of the day.** Daytime is cut into five: pratah, sangava,
  madhyahna, aparahna, sayahna. Pradosh is the first fifth of the night.
  Nishita is the eighth of the night's fifteen muhurtas. Arunodaya is the 96
  minutes before sunrise.
- **Rules.** Each festival names its tithi or star, its month, and the part
  of the day it must touch. When it touches that part on two days, or on
  none, the rule says which day wins. The rules below are the classical
  rules as commonly stated, written in our own words.

## Supported festivals

### Hindu

| id | Festival | Rule |
| --- | --- | --- |
| `makar-sankranti` | Makar Sankranti | The day the Sun enters sidereal Makara (Capricorn); when the ingress is after sunset, the next day, which holds the punya kaal. |
| `uttarayan` | Uttarayan | Gujarat's kite festival, on Makar Sankranti. |
| `pongal` | Thai Pongal | Thai 1, the first day of the Tamil solar month Thai: the day the Sun enters Makara, or the next day when it enters after sunset. |
| `bhogi` | Bhogi | The day before Thai Pongal. |
| `magh-bihu` | Magh Bihu | Magh 1 of the Assamese solar calendar: the day after the Sun enters Makara. |
| `bihu` | Rongali Bihu | From the day the Sun enters Mesha (Goru Bihu, the last day of Chot) to Bohag 1, the next day (Manuh Bihu). |
| `vishu` | Vishu | The Kerala new year: Vishukkani is seen at the first sunrise after the Sun enters Mesha. |
| `puthandu` | Puthandu | Chithirai 1, the Tamil new year: the day the Sun enters Mesha, or the next day when it enters after sunset. |
| `pohela-boishakh` | Pohela Boishakh | Boishakh 1, the Bengali new year (West Bengal reckoning): the day after the Sun enters Mesha. |
| `onam` | Onam | From Atham (Hasta nakshatra) to Thiruvonam (Shravana nakshatra) in the Malayalam month Chingam (Sun in sidereal Simha). Thiruvonam is the day whose star, read six nazhikas (144 minutes) after sunrise as Kerala names a day's star, is Shravana; Atham is the day before it on which Hasta prevails at midday. Chingam starts on the day of the ingress if it comes before the end of madhyahna, else the next day. |
| `thaipusam` | Thaipusam | The day Pusam (Pushya) nakshatra is current at sunrise, lasting at least a muhurta after it, in the Tamil month Thai (Sun in sidereal Makara); if twice, the one nearer Purnima. |
| `karthigai-deepam` | Karthigai Deepam | The evening Karthigai (Krittika) nakshatra is current at sunset, when the lamps are lit, in the Tamil month Karthigai (Sun in sidereal Vrischika); at no sunset, the day it is current at sunrise; if twice in the month, the one nearer Purnima. |
| `vasant-panchami` | Vasant Panchami | Magha Shukla Panchami, on the day Panchami prevails in the forenoon (purvahna). |
| `ratha-saptami` | Ratha Saptami | Magha Shukla Saptami, on the day Saptami is current at sunrise (the bath is at dawn). |
| `maha-shivratri` | Maha Shivratri | Krishna Chaturdashi of Magha (amanta; Phalguna in the purnimanta reckoning), on the night Chaturdashi prevails at nishita, the midnight muhurta. |
| `holika-dahan` | Holika Dahan | Phalguna Purnima, on the evening Purnima prevails in pradosh (the first fifth of the night) free of bhadra. If bhadra covers it: the next evening when Purnima lasts three and a half prahars (7/8 of daytime) after that sunrise and the Pratipada after it is longer than Purnima; else the same evening, after bhadra ends or in bhadra punchha. A Purnima that touches no pradosh is burnt the night it begins. |
| `holi` | Holi | Rangwali Holi, the day after Holika Dahan. |
| `gudi-padwa` | Gudi Padwa / Ugadi | Chaitra Shukla Pratipada, the day Pratipada is current at sunrise: the lunar new year. |
| `cheti-chand` | Cheti Chand | The Sindhi new year: the day after Chaitra Amavasya on which the new crescent is first seen (chandra darshan), taken as the first evening the Moon sets an hour or more after the Sun. |
| `chaitra-navratri` | Chaitra Navratri | From Ghatasthapana to Rama Navami (Smarta). Ghatasthapana: Chaitra Shukla Pratipada, the day it is current at sunrise and lasts at least a muhurta after it; else the day it begins. |
| `gangaur` | Gangaur | Chaitra Shukla Tritiya (Gauri Tritiya), the day Tritiya is current at sunrise. |
| `ram-navami` | Rama Navami | Chaitra Shukla Navami. Smarta: the day Navami prevails at madhyahna (Rama was born at midday); the second day if it does on both. Vaishnava: the first day Navami is current at arunodaya (the 96 minutes before sunrise) or sunrise, and never before the Smarta day. |
| `hanuman-jayanti` | Hanuman Jayanti | Chaitra Purnima (North Indian reckoning), the day Purnima is current at sunrise. |
| `akshaya-tritiya` | Akshaya Tritiya | Vaishakha Shukla Tritiya, the day Tritiya prevails in the forenoon (purvahna); when it does on two days, the second if Tritiya lasts three muhurtas after its sunrise. |
| `parshuram-jayanti` | Parshuram Jayanti | Vaishakha Shukla Tritiya, the evening Tritiya prevails in pradosh (Parashurama was born at dusk); the second if on both; if on neither, the evening before Tritiya begins. |
| `vat-savitri` | Vat Savitri | Jyeshtha Amavasya in the purnimanta reckoning (amanta Vaishakha Amavasya), the day Amavasya prevails at madhyahna. |
| `ganga-dussehra` | Ganga Dussehra | Jyeshtha Shukla Dashami, the day Dashami prevails in the forenoon (purvahna). In a year with an adhik Jyeshtha it is kept in the adhik month. |
| `rath-yatra` | Rath Yatra | Ashadha Shukla Dwitiya, the day Dwitiya is current at sunrise. |
| `guru-purnima` | Guru Purnima | Ashadha Purnima (Vyasa Purnima), the day Purnima is current at sunrise. |
| `hariyali-teej` | Hariyali Teej | Shravana Shukla Tritiya, the day Tritiya is current at sunrise. |
| `nag-panchami` | Nag Panchami | Shravana Shukla Panchami, the day Panchami is current at sunrise. |
| `raksha-bandhan` | Raksha Bandhan | Shravana Purnima, on the day Purnima prevails in aparahna (the fourth fifth of daytime) free of bhadra. If bhadra covers it, the next day when Purnima lasts three muhurtas after that sunrise; otherwise the Purnima day, after bhadra ends. |
| `kajari-teej` | Kajari Teej | Bhadrapada Krishna Tritiya (purnimanta; amanta Shravana Krishna Tritiya), the day Tritiya is current at sunrise. |
| `janmashtami` | Krishna Janmashtami | Krishna Ashtami of Bhadrapada (purnimanta; amanta Shravana). Smarta: the night Ashtami and Rohini nakshatra are together at nishita (Jayanti); else, when the day after the Ashtami midnight keeps Ashtami at sunrise, Rohini joins it that day and is there at nishita, that day; else the night Ashtami prevails at nishita (Krishna was born at midnight). Vaishnava: the first day Ashtami is current at arunodaya (the 96 minutes before sunrise) or sunrise, and never before the Smarta day. |
| `hartalika-teej` | Hartalika Teej | Bhadrapada Shukla Tritiya, the day Tritiya is current at sunrise. |
| `ganesh-chaturthi` | Ganesh Chaturthi | Bhadrapada Shukla Chaturthi, the day Chaturthi prevails at madhyahna (Ganesha was born at midday); on both days, the one it covers more. |
| `navratri` | Navratri | Sharad Navratri, from Ghatasthapana (Ashwin Shukla Pratipada, the day it is current at sunrise and lasts at least a muhurta after it; else the day it begins) to Maha Navami (the day Navami prevails in aparahna). |
| `durga-puja` | Durga Puja | From Maha Shashthi to Vijaya Dashami of Ashwin Shukla, each the day its tithi is current at sunrise. |
| `dussehra` | Dussehra | Ashwin Shukla Dashami (Vijayadashami), the day Dashami prevails in aparahna; on both days, the one on which Shravana nakshatra joins Dashami in aparahna, else the first. |
| `sharad-purnima` | Sharad Purnima | Ashwin Purnima (Kojagara), the night Purnima prevails at nishita; the second if on both. |
| `karva-chauth` | Karva Chauth | Kartika Krishna Chaturthi (purnimanta; amanta Ashwin Krishna Chaturthi), the day Chaturthi is current at moonrise; if at no moonrise, the day it is current at sunrise. |
| `ahoi-ashtami` | Ahoi Ashtami | Kartika Krishna Ashtami (purnimanta; amanta Ashwin Krishna Ashtami), the day Ashtami prevails at dusk (pradosh), when the stars come out. |
| `diwali` | Diwali | Five days from Dhanteras to Bhai Dooj. Dhanteras: Krishna Trayodashi in pradosh. Lakshmi Puja: Amavasya in pradosh (amanta Ashwin, purnimanta Kartika). Govardhan Puja: Kartika Shukla Pratipada at sunrise. Bhai Dooj: Shukla Dwitiya in aparahna (the day it covers more of it). |
| `kali-puja` | Kali Puja | The Amavasya of Diwali, on the night Amavasya prevails at nishita (midnight). |
| `chhath-puja` | Chhath Puja | Four days around Kartika Shukla Shashthi: Nahay Khay, Kharna, Sandhya Arghya on the day Shashthi is current at sunrise, and Usha Arghya at the next sunrise. |
| `tulsi-vivah` | Tulsi Vivah | Kartika Shukla Dwadashi, the day Dwadashi is current at sunrise. |
| `dev-deepawali` | Dev Deepawali | Kartika Purnima, the evening Purnima prevails in pradosh, when the lamps are lit. |
| `vivah-panchami` | Vivah Panchami | Margashirsha Shukla Panchami, the day Panchami is current at sunrise. |
| `gita-jayanti` | Gita Jayanti | Margashirsha Shukla Ekadashi (Mokshada Ekadashi), the day Ekadashi is current at sunrise; when at two sunrises, the second. |

### Sikh

| id | Festival | Rule |
| --- | --- | --- |
| `lohri` | Lohri | The eve of Makar Sankranti. |
| `baisakhi` | Baisakhi | Vaisakh 1 in Punjab: the local day the Sun enters sidereal Mesha (Aries). |
| `hola-mohalla` | Hola Mohalla | Three days from Chaitra Krishna Pratipada (amanta Phalguna Krishna Pratipada), the day Pratipada is current at sunrise. |
| `guru-nanak-jayanti` | Guru Nanak Jayanti | Kartika Purnima (Gurpurab), the day Purnima is current at sunrise. |
| `guru-gobind-singh-jayanti` | Guru Gobind Singh Jayanti | Pausha Shukla Saptami, the day Saptami is current at sunrise. A Gregorian year can have none or two. |

### Jain

| id | Festival | Rule |
| --- | --- | --- |
| `mahavir-jayanti` | Mahavir Jayanti | Chaitra Shukla Trayodashi, the day Trayodashi is current at sunrise. |
| `samvatsari` | Samvatsari | Bhadrapada Shukla Chaturthi (Shvetambara), the day Chaturthi is current at sunrise; when it is current at two sunrises, the second. |
| `paryushan` | Paryushan | The eight days of the Shvetambara Paryushan, ending on Samvatsari. |
| `das-lakshan` | Das Lakshan | The Digambara Das Lakshan Parva, from Bhadrapada Shukla Panchami (the day it prevails at madhyahna) to Anant Chaturdashi (the day Chaturdashi is current at sunrise). |

### Buddhist

| id | Festival | Rule |
| --- | --- | --- |
| `buddha-purnima` | Buddha Purnima | Vaishakha Purnima, the day Purnima is current at sunrise. |

### Parsi

| id | Festival | Rule |
| --- | --- | --- |
| `parsi-new-year` | Parsi New Year (Navroz) | Shahenshahi Navroz, 1 Farvardin: a 365-day year counted from the Yazdegerdi era (16 June 632, Julian), one month behind the Qadimi reckoning. It moves a day earlier every four years. |
| `khordad-sal` | Khordad Sal | Zarathustra's birthday, 6 Farvardin (Shahenshahi): five days after Navroz. |
| `jamshedi-navroz` | Jamshedi Navroz | The March equinox (the Fasli/Iranian new year): the day of the equinox in Tehran if it comes before noon there, else the next day. |

### Christian

| id | Festival | Rule |
| --- | --- | --- |
| `palm-sunday` | Palm Sunday | The Sunday before Easter (Western computus). |
| `good-friday` | Good Friday | The Friday before Easter (Western computus). |
| `easter` | Easter | Western Easter Sunday by the Gregorian computus: the Sunday after the ecclesiastical full moon on or after 21 March. |
| `christmas` | Christmas | 25 December. |

### Chinese

| id | Festival | Rule |
| --- | --- | --- |
| `lunar-new-year` | Lunar New Year | Chinese New Year and the day after: the new moon that starts month 1 of the Chinese calendar, by Beijing time (UTC+8), usually the second new moon after the winter solstice. |

### Civic and family days

| id | Festival | Rule |
| --- | --- | --- |
| `new-year` | New Year | 1 January. |
| `republic-day` | Republic Day | India: 26 January. |
| `womens-day` | International Women's Day | 8 March. |
| `independence-day` | Independence Day | India: 15 August. |
| `teachers-day` | Teachers' Day | India: 5 September. |
| `gandhi-jayanti` | Gandhi Jayanti | India: 2 October. |
| `childrens-day` | Children's Day | India: 14 November. |
| `friendship-day` | Friendship Day | The first Sunday of August (as kept in India). |
| `mothers-day` | Mother's Day | The second Sunday of May; in the UK and Ireland, Mothering Sunday, three weeks before Easter; in the UAE and much of the Arab world, 21 March. |
| `fathers-day` | Father's Day | The third Sunday of June; in Australia and New Zealand, the first Sunday of September. |
| `thanksgiving` | Thanksgiving | Canada: the second Monday of October. United States: the fourth Thursday of November. Elsewhere none. |
| `grandparents-day` | Grandparents' Day | Canada and the United States: the Sunday after Labour Day (the first Monday of September). Elsewhere none. |

Christmas (25 December) and New Year (1 January) are included as fixed days.

## Not supported

- **Islamic festivals** (Eid al-Fitr, Eid al-Adha, Islamic New Year,
  Milad-un-Nabi, Ramadan, Shab-e-Barat, Shab-e-Qadr). They depend on the
  local sighting of the crescent. Out of scope.
- **Losar.** It follows the Tibetan (Phugpa) calendar, which has its own
  arithmetic. It is not implemented, rather than guessed from Lunar New
  Year.

## Accuracy

These dates are calculated. Regional customs differ, and so do panchangs:
a tithi that ends minutes after sunrise, a second day of Purnima, a
community that follows another school. When a festival falls close to such
a boundary, two good calendars can disagree by a day.

Use this library for greetings, reminders and planning. For religious
observance, verify with your community's panchang or priest.

## Credits

- Astronomy: [astronomy-engine](https://github.com/cosinekitty/astronomy)
  by Don Cross (MIT).
- Built by [Paperdrop Corp](https://paperdrop.io) for
  [Twinden](https://twinden.com), the private family app.

## License

MIT. Copyright (c) 2026 Paperdrop Corp.
