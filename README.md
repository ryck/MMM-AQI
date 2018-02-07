# MMM-AQI

This a module for the [MagicMirror](https://github.com/MichMich/MagicMirror).

This module gets real time arrival predictions for specific stops using the TfL API.


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



Here is an example of an entry in `config.js`

```
{
	module: 'MMM-AQI',
	position: 'bottom_left',
	header: 'Bus Arrivals',
	config: {
		token: "",
		animationSpeed: 1000,
		initialLoadDelay: 0,
		debug: false
	}
},
```

## Dependencies
- [request](https://www.npmjs.com/package/request) (installed via `npm install`)


## Thanks To...
- [Nick Wootton](https://github.com/MichMich) for the [MMM-UKLiveBusStopInfo](https://github.com/nwootton/MMM-UKLiveBusStopInfo) module, which I used as reference.
- [Nigel Daniels](https://github.com/nigel-daniels/) for the [MMM-Tube-Status](https://github.com/nigel-daniels/MMM-Tube-Status) module, which I used as reference.
- [Michael Teeuw](https://github.com/MichMich) for the [MagicMirror2](https://github.com/MichMich/MagicMirror/) framework that made this module possible.
- [Transport for London](https://tfl.gov.uk) for the guides and information they publish on their API.
