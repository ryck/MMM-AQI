# MMM-AQI

This a module for the [MagicMirror](https://github.com/MichMich/MagicMirror).

MagicMirror module to get the Air Quality Index (AQI) using the World Air Quality Index project API.

![](screenshots/screenshot_01.png)


## Installation
```bash
git clone https://github.com/ryck/MMM-AQI.git
cd MMM-AQI
npm install
```
## Config
The entry in `config.js` can include the following options:

|Option|Description|
|---|---|
|`token`|**Required** Your private API token ([see aqicn.org/data-platform/token/](http://aqicn.org/data-platform/token/))<br>**Type:** `string`|
|`city`|**Required** Name of the city (eg Beijing), or id (eg @7397). You can also use the keyword `here` to use geolocation to get your city<br>**Type:** `string`<br>**Possible values:** `here`  for geolocation, `nameOfCity` or `@id`<br> **Default value:**  `here`|
| `iaqi`|Display individual AQI for all pollutants (PM2.5, PM10, NO2, CO, SO2, Ozone)<br>**Type:** `boolean`<br>**Possible values:** `true` or `false`<br> **Default value:**  `true`|
|`updateInterval `|How often the data is updated. (Milliseconds)<br>**Type:** `integer`<br>**Default value:** `30 * 60 * 1000` (Half hour)|
| `initialLoadDelay`|The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds)<br>**Type:** `integer`<br>**Possible values:** `1000` - `5000` <br> **Default value:**  `0`|
| `animationSpeed`|Speed of the update animation. (Milliseconds)<br>**Type:** `integer`<br>**Possible values:**`0` - `5000` <br> **Default value:** `1000` (1 second)|
| `debug`| Show debug information.<br>**Type:** `boolean`<br>**Possible values:** `true` or `false`  <br> **Default value:** `false`|


Here is an example of an entry in `config.js`

```
		{
			module: 'MMM-AQI',
			position: 'bottom_left',
			header: 'Air Quality Index (AQI)',
			config: {
				token: "",
				city: "here",
				iaqi: true,
				updateInterval: 30 * 60 * 1000, // Every half hour.
				initialLoadDelay: 0,
				animationSpeed: 1000,
				debug: false
			}
		},
```

## Find you city
The API is quite picky with the cities, so yoiur best option is to use the keyword _here_ or an id.
To find your id, just enter this URL in your browser:

[https://api.waqi.info/search/?token=TOKEN&keyword=CITY](https://api.waqi.info/search/?token=TOKEN&keyword=CITY)

**Note:** You need to replace _TOKEN_ and _CITY_ for your token (the same one you are using in the module works) and the city you are looking for, repectively.

## Dependencies
- [request](https://www.npmjs.com/package/request) (installed via `npm install`)


## Thanks To...
- The [World Air Quality Index](http://aqicn.org/) project for providing the API.
- [Nick Wootton](https://github.com/MichMich) for the [MMM-UKLiveBusStopInfo](https://github.com/nwootton/MMM-UKLiveBusStopInfo) module, which I used as reference.
- [Nigel Daniels](https://github.com/nigel-daniels/) for the [MMM-Tube-Status](https://github.com/nigel-daniels/MMM-Tube-Status) module, which I used as reference.
- [Michael Teeuw](https://github.com/MichMich) for the [MagicMirror2](https://github.com/MichMich/MagicMirror/) framework that made this module possible.
- [Transport for London](https://tfl.gov.uk) for the guides and information they publish on their API.
