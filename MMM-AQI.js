/* MagicMirror²
 * Module: MMM-AQI
 * By Ricardo Gonzalez https://github.com/ryck/MMM-AQI
 * MIT Licensed.
 */

Module.register("MMM-AQI", {
	defaults: {
		token: "",
		city: "here",
		iaqi: true,
		updateInterval: 30 * 60 * 1000, // Every half hour
		overrideCityDisplayName: null,
		initialLoadDelay: 0, // No delay
		animationSpeed: 1000, // One second
		debug: false,
		showLastUpdate: true,
		maxEntries: 10, // Maximum IAQI entries to show
		units: "metric", // metric or imperial
		weather: false, // Show weather data (temperature, humidity, pressure, wind)
	},

	// Module state
	loaded: false,
	result: null,
	updateTimer: null,
	suspended: false,

	// AQI level definitions
	aqiLevels: [
		{ min: 0, max: 50, class: "good", icon: "\uf041", name: "GOOD" },
		{ min: 51, max: 100, class: "moderate", icon: "\uf062", name: "MODERATE" },
		{
			min: 101,
			max: 150,
			class: "unhealthy-sensitive",
			icon: "\uf074",
			name: "UNHEALTHY_SENSITIVE",
		},
		{
			min: 151,
			max: 200,
			class: "unhealthy",
			icon: "\uf074",
			name: "UNHEALTHY",
		},
		{
			min: 201,
			max: 300,
			class: "very-unhealthy",
			icon: "\uf074",
			name: "VERY_UNHEALTHY",
		},
		{
			min: 301,
			max: Infinity,
			class: "hazardous",
			icon: "\uf071",
			name: "HAZARDOUS",
		},
	],

	// Pollutant-specific thresholds keyed by unit to drive IAQI color coding
	pollutantThresholds: {
		pm25: {
			ugm3: [
				{ min: 0, max: 12, class: "good" },
				{ min: 12, max: 35.4, class: "moderate" },
				{ min: 35.4, max: 55.4, class: "unhealthy-sensitive" },
				{ min: 55.4, max: 150.4, class: "unhealthy" },
				{ min: 150.4, max: 250.4, class: "very-unhealthy" },
				{ min: 250.4, max: 350.4, class: "hazardous" },
				{ min: 350.4, max: 500.4, class: "hazardous" },
				{ min: 500.4, max: Infinity, class: "hazardous" },
			],
		},
		pm10: {
			ugm3: [
				{ min: 0, max: 54, class: "good" },
				{ min: 54, max: 154, class: "moderate" },
				{ min: 154, max: 254, class: "unhealthy-sensitive" },
				{ min: 254, max: 354, class: "unhealthy" },
				{ min: 354, max: 424, class: "very-unhealthy" },
				{ min: 424, max: 504, class: "hazardous" },
				{ min: 504, max: 604, class: "hazardous" },
				{ min: 604, max: Infinity, class: "hazardous" },
			],
		},
		o3: {
			ppb: [
				{ min: 0, max: 54, class: "good" },
				{ min: 54, max: 70, class: "moderate" },
				{ min: 70, max: 85, class: "unhealthy-sensitive" },
				{ min: 85, max: 105, class: "unhealthy" },
				{ min: 105, max: 200, class: "very-unhealthy" },
				{ min: 200, max: Infinity, class: "hazardous" },
			],
			ugm3: [
				{ min: 0, max: 106, class: "good" },
				{ min: 106, max: 137, class: "moderate" },
				{ min: 137, max: 167, class: "unhealthy-sensitive" },
				{ min: 167, max: 206, class: "unhealthy" },
				{ min: 206, max: 392, class: "very-unhealthy" },
				{ min: 392, max: Infinity, class: "hazardous" },
			],
		},
		no2: {
			ppb: [
				{ min: 0, max: 53, class: "good" },
				{ min: 53, max: 100, class: "moderate" },
				{ min: 100, max: 360, class: "unhealthy-sensitive" },
				{ min: 360, max: 649, class: "unhealthy" },
				{ min: 649, max: 1249, class: "very-unhealthy" },
				{ min: 1249, max: 1649, class: "hazardous" },
				{ min: 1649, max: 2049, class: "hazardous" },
				{ min: 2049, max: Infinity, class: "hazardous" },
			],
			ugm3: [
				{ min: 0, max: 100, class: "good" },
				{ min: 100, max: 188, class: "moderate" },
				{ min: 188, max: 677, class: "unhealthy-sensitive" },
				{ min: 677, max: 1220, class: "unhealthy" },
				{ min: 1220, max: 2344, class: "very-unhealthy" },
				{ min: 2344, max: 3090, class: "hazardous" },
				{ min: 3090, max: 3836, class: "hazardous" },
				{ min: 3836, max: Infinity, class: "hazardous" },
			],
		},
		so2: {
			ugm3: [
				{ min: 0, max: 91.7, class: "good" },
				{ min: 91.7, max: 196.5, class: "moderate" },
				{ min: 196.5, max: 484.7, class: "unhealthy-sensitive" },
				{ min: 484.7, max: 796.5, class: "unhealthy" },
				{ min: 796.5, max: 1582, class: "very-unhealthy" },
				{ min: 1582, max: 2106, class: "hazardous" },
				{ min: 2106, max: 2632, class: "hazardous" },
				{ min: 2632, max: Infinity, class: "hazardous" },
			],
			ppb: [
				{ min: 0, max: 35, class: "good" },
				{ min: 35, max: 75, class: "moderate" },
				{ min: 75, max: 185, class: "unhealthy-sensitive" },
				{ min: 185, max: 304, class: "unhealthy" },
				{ min: 304, max: 604, class: "very-unhealthy" },
				{ min: 604, max: 804, class: "hazardous" },
				{ min: 804, max: 1004, class: "hazardous" },
				{ min: 1004, max: Infinity, class: "hazardous" },
			],
		},
		co: {
			ppm: [
				{ min: 0, max: 4.4, class: "good" },
				{ min: 4.4, max: 9.4, class: "moderate" },
				{ min: 9.4, max: 12.4, class: "unhealthy-sensitive" },
				{ min: 12.4, max: 15.4, class: "unhealthy" },
				{ min: 15.4, max: 30.4, class: "very-unhealthy" },
				{ min: 30.4, max: 40.4, class: "hazardous" },
				{ min: 40.4, max: 50.4, class: "hazardous" },
				{ min: 50.4, max: Infinity, class: "hazardous" },
			],
			mgm3: [
				{ min: 0, max: 5, class: "good" },
				{ min: 5, max: 10.8, class: "moderate" },
				{ min: 10.8, max: 14.2, class: "unhealthy-sensitive" },
				{ min: 14.2, max: 17.6, class: "unhealthy" },
				{ min: 17.6, max: 34.8, class: "very-unhealthy" },
				{ min: 34.8, max: 46.4, class: "hazardous" },
				{ min: 46.4, max: 57.9, class: "hazardous" },
				{ min: 57.9, max: Infinity, class: "hazardous" },
			],
		},
	},

	start() {
		Log.info(`Starting module: ${this.name}`);

		// Validate configuration
		if (!this.validateConfig()) {
			return;
		}

		this.initializeModule();
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	/**
	 * Validates the module configuration
	 * @returns {boolean} True if config is valid
	 */
	validateConfig() {
		const errors = [];

		if (!this.config.token || this.config.token.trim() === "") {
			errors.push(this.translate("CONFIG_ERROR_NO_TOKEN"));
		}

		if (!this.config.city || this.config.city.trim() === "") {
			errors.push(this.translate("CONFIG_ERROR_NO_CITY"));
		}

		if (this.config.updateInterval < 60000) {
			errors.push(this.translate("CONFIG_ERROR_UPDATE_INTERVAL"));
		}

		if (errors.length > 0) {
			Log.error(`${this.name} configuration errors:`, errors);
			this.result = {
				error: true,
				message: errors.join(". "),
				timestamp: moment().format("LLL"),
			};
			this.updateDom();
			return false;
		}

		return true;
	},

	/**
	 * Initialize module properties
	 */
	initializeModule() {
		this.apiBase = `https://api.waqi.info/feed/${this.config.city}/`;
		this.url = encodeURI(this.apiBase + this.getParams());

		if (this.config.debug) {
			Log.info(`${this.name} API URL:`, this.url);
		}

		this.updateAQI();
	},

	/**
	 * Request AQI data update
	 */
	updateAQI() {
		if (this.suspended) {
			this.scheduleUpdate();
			return;
		}

		this.sendSocketNotification("GET_AQI", {
			url: this.url,
			identifier: this.identifier,
		});
	},

	/**
	 * Get AQI level information for a given value
	 * @param {number} aqi - AQI value
	 * @returns {object} Level information
	 */
	getAQILevel(aqi) {
		return (
			this.aqiLevels.find((level) => aqi >= level.min && aqi <= level.max) ||
			this.aqiLevels[0]
		);
	},

	getStyles() {
		return ["MMM-AQI.css", "weather-icons.css"];
	},

	getScripts() {
		return ["moment.js"];
	},

	getTranslations() {
		return {
			en: "translations/en.json",
			de: "translations/de.json",
			es: "translations/es.json",
			fr: "translations/fr.json",
		};
	},

	getHeader() {
		if (!this.loaded || !this.result?.data) {
			return this.data.header;
		}

		const city =
			this.config.overrideCityDisplayName ?? this.result.data.city?.name;
		return this.data.header || `${this.translate("AQI")} - ${city}`;
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "mmm-aqi-wrapper";

		// Show configuration errors
		if (this.result?.error) {
			return this.createErrorElement(this.result.message);
		}

		// Show loading state
		if (!this.loaded) {
			return this.createLoadingElement();
		}

		// Show data or API errors
		if (!this.result?.data) {
			const errorMsg =
				this.result?.message || this.translate("NO_DATA_AVAILABLE");
			return this.createErrorElement(errorMsg);
		}

		// Create main content
		return this.createMainContent(wrapper);
	},

	/**
	 * Create error display element
	 * @param {string} message - Error message
	 * @returns {HTMLElement} Error element
	 */
	createErrorElement(message) {
		const wrapper = document.createElement("div");
		wrapper.innerHTML = message;
		wrapper.className = "dimmed light small";
		return wrapper;
	},

	/**
	 * Create loading display element
	 * @returns {HTMLElement} Loading element
	 */
	createLoadingElement() {
		const wrapper = document.createElement("div");
		wrapper.innerHTML = this.translate("LOADING");
		wrapper.className = "dimmed light small";
		return wrapper;
	},

	/**
	 * Create main content display
	 * @param {HTMLElement} wrapper - Container element
	 * @returns {HTMLElement} Main content element
	 */
	createMainContent(wrapper) {
		const table = document.createElement("table");

		// Add main AQI row
		this.addMainAQIRow(table);

		// Add individual air quality indicators and weather data
		if (this.result.data.iaqi) {
			this.addIAQIRows(table);
		}

		// Add last update time
		if (this.config.showLastUpdate && this.result.timestamp) {
			this.addLastUpdateRow(table);
		}

		wrapper.appendChild(table);
		return wrapper;
	},

	/**
	 * Add main AQI data row
	 * @param {HTMLElement} table - Table element
	 */
	addMainAQIRow(table) {
		const aqi = this.result.data.aqi;
		const level = this.getAQILevel(aqi);
		const city =
			this.config.overrideCityDisplayName ?? this.result.data.city?.name;

		const row = document.createElement("tr");

		// City cell with icon
		const cityCell = document.createElement("td");
		cityCell.className = `city ${level.class}`;
		cityCell.innerHTML = `<i class="wi">${level.icon}</i> ${city}`;

		row.appendChild(cityCell);

		if (!this.config.iaqi) {
			// AQI value cell
			const aqiCell = document.createElement("td");
			aqiCell.className = `aqi ${level.class}`;
			aqiCell.innerHTML = `<strong>${aqi}</strong>`;
			row.appendChild(aqiCell);
		}
		table.appendChild(row);
	},

	/**
	 * Add individual air quality indicator rows
	 * @param {HTMLElement} table - Table element
	 */
	addIAQIRows(table) {
		const iaqi = this.result.data.iaqi;
		const level = this.getAQILevel(this.result.data.aqi);

		// Define air quality pollutants vs weather data
		const airQualityKeys = ["pm25", "pm10", "o3", "no2", "so2", "co"];
		const weatherKeys = ["t", "h", "p", "w"];

		// Get air quality entries with custom order
		const airQualityOrder = { pm25: 1, pm10: 2, o3: 3, no2: 4, so2: 5, co: 6 };
		const airQualityEntries = Object.entries(iaqi)
			.filter(([key]) => airQualityKeys.includes(key.toLowerCase()))
			.sort((a, b) => {
				const orderA = airQualityOrder[a[0].toLowerCase()] || 99;
				const orderB = airQualityOrder[b[0].toLowerCase()] || 99;
				return orderA - orderB;
			})
			.slice(0, this.config.maxEntries);

		// Add air quality indicators (only if iaqi is enabled)
		if (this.config.iaqi) {
			airQualityEntries.forEach(([key, data]) => {
				const row = document.createElement("tr");

				// Indicator name
				const nameCell = document.createElement("td");
				nameCell.className = `iaqi-key xsmall ${level.class}`;
				const mainName =
					this.translate(`IAQI_${key.toUpperCase()}`) || key.toUpperCase();
				const descName = this.translate(`IAQI_${key.toUpperCase()}_DESC`) || "";
				nameCell.innerHTML = descName
					? `${mainName} <span class="iaqi-desc">(${descName})</span>`
					: mainName;
				row.appendChild(nameCell);

				// Indicator value
				const valueCell = document.createElement("td");
				const pollutantValue = this.formatPollutantValue(key, data.v);
				const pollutantClass = this.getPollutantColorClass(key, pollutantValue);
				valueCell.className = "iaqi-value xsmall";
				const unitSuffix = pollutantValue.unit ? ` ${pollutantValue.unit}` : "";
				const keyLower = key.toLowerCase();
				const isPM = ["pm25", "pm10"].includes(keyLower);
				const valueSpanClasses = ["pollutant-value"];
				if (!isPM) {
					valueSpanClasses.push(pollutantClass || level.class);
				} else {
					valueSpanClasses.push(level.class);
				}
				const spanClassAttr = valueSpanClasses.join(" ");
				valueCell.innerHTML = `<span class="${spanClassAttr}"><strong>${pollutantValue.value}</strong></span>${unitSuffix}`;
				row.appendChild(valueCell);

				table.appendChild(row);
			});
		}

		// Add weather data if enabled
		if (this.config.weather) {
			const weatherEntries = Object.entries(iaqi)
				.filter(([key]) => weatherKeys.includes(key.toLowerCase()))
				.sort((a, b) => {
					// Custom sort order for weather: T, H, P, W
					const order = { t: 1, h: 2, p: 3, w: 4 };
					return (
						(order[a[0].toLowerCase()] || 99) -
						(order[b[0].toLowerCase()] || 99)
					);
				});

			weatherEntries.forEach(([key, data]) => {
				const row = document.createElement("tr");

				// Weather indicator name
				const nameCell = document.createElement("td");
				nameCell.className = `iaqi-key xsmall weather-data`;
				nameCell.innerHTML =
					this.translate(`IAQI_${key.toUpperCase()}`) || key.toUpperCase();
				row.appendChild(nameCell);

				// Weather indicator value
				const valueCell = document.createElement("td");
				valueCell.className = `iaqi-value xsmall weather-data`;
				const weatherValue = this.formatWeatherValue(key, data.v);
				valueCell.innerHTML = weatherValue.unit
					? `<strong>${weatherValue.value}</strong>${weatherValue.unit}`
					: `<strong>${weatherValue.value}</strong>`;
				row.appendChild(valueCell);

				table.appendChild(row);
			});
		}
	},

	/**
	 * Add last update timestamp row
	 * @param {HTMLElement} table - Table element
	 */
	addLastUpdateRow(table) {
		const row = document.createElement("tr");
		const cell = document.createElement("td");
		cell.colSpan = 3;
		cell.className = "last-update dimmed";
		cell.innerHTML = `${this.translate("LAST_UPDATE")}: ${this.result.timestamp}`;
		row.appendChild(cell);
		table.appendChild(row);
	},

	/**
	 * Process received AQI data
	 * @param {object} result - API response data
	 */
	processAQI(result) {
		this.result = {
			timestamp: moment().format("LLL"),
			error: false,
		};

		if (result && result.status === "ok" && result.data) {
			this.result.data = result.data;

			if (this.config.debug) {
				Log.info(`${this.name} data received:`, result);
			}
		} else {
			this.result.message = result?.data || this.translate("API_ERROR");
			this.result.data = null;

			Log.warn(`${this.name} API error:`, result);
		}

		this.updateDom(this.config.animationSpeed);
		this.loaded = true;
	},

	/**
	 * Handle failed API request
	 * @param {object} error - Error information
	 */
	processError(error) {
		this.result = {
			error: true,
			message: this.translate("CONNECTION_ERROR"),
			timestamp: moment().format("LLL"),
		};

		Log.error(`${this.name} failed to load AQI data:`, error);
		this.updateDom(this.config.animationSpeed);
		this.loaded = true;
	},

	/**
	 * Format pollutant values with appropriate units
	 * @param {string} key - Pollutant parameter key
	 * @param {number} value - Raw value
	 * @returns {{value: string|number, unit: string, numericValue: number|null, unitKey: string}}
	 */
	formatPollutantValue(key, value) {
		const numericValue = Number(value);
		const safeValue = Number.isFinite(numericValue) ? numericValue : value;
		let unit = "";
		let unitKeyOverride = null;
		switch (key.toLowerCase()) {
			case "pm25":
			case "pm10":
				unitKeyOverride = "ugm3";
				break;
			case "o3": // Ozone
			case "no2": // Nitrogen Dioxide
			case "so2": // Sulfur Dioxide
				unit = "μg/m³";
				break;
			case "co": // Carbon Monoxide
				unit = "mg/m³";
				unitKeyOverride = "mgm3";
				break;
		}

		return {
			value: safeValue,
			unit,
			numericValue: Number.isFinite(numericValue) ? numericValue : null,
			unitKey: unitKeyOverride || this.normalizeUnitKey(unit),
		};
	},

	/**
	 * Format weather values with appropriate units
	 * @param {string} key - Weather parameter key
	 * @param {number} value - Raw value
	 * @returns {string} Formatted value with units
	 */
	formatWeatherValue(key, value) {
		switch (key.toLowerCase()) {
			case "t": // Temperature
				if (this.config.units === "imperial") {
					return { value: Math.round((value * 9) / 5 + 32), unit: "°F" };
				}
				return { value, unit: "°C" };
			case "h": // Humidity
				return { value, unit: "%" };
			case "p": // Pressure
				if (this.config.units === "imperial") {
					return { value: Math.round(value * 0.02953), unit: " inHg" };
				}
				return { value, unit: " hPa" };
			case "w": // Wind Speed
				if (this.config.units === "imperial") {
					return { value: Math.round(value * 2.237), unit: " mph" };
				}
				return { value, unit: " m/s" };
			default:
				return { value, unit: "" };
		}
	},

	/**
	 * Determine pollutant color class based on configured unit thresholds
	 * @param {string} key - Pollutant key
	 * @param {{numericValue: number|null, unitKey: string}} pollutantValue - Structured pollutant data
	 * @returns {string|null} CSS class representing the pollutant range
	 */
	getPollutantColorClass(key, pollutantValue) {
		if (!pollutantValue || !Number.isFinite(pollutantValue.numericValue)) {
			return null;
		}

		const pollutantKey = key.toLowerCase();
		const unitKey = pollutantValue.unitKey;
		if (!unitKey) {
			return null;
		}

		const pollutantThreshold = this.pollutantThresholds[pollutantKey];
		if (!pollutantThreshold) {
			return null;
		}

		const unitThresholds = pollutantThreshold[unitKey];
		if (!unitThresholds) {
			return null;
		}

		const matchingRange = unitThresholds.find(
			(range) =>
				pollutantValue.numericValue >= range.min &&
				pollutantValue.numericValue <= range.max,
		);

		return matchingRange?.class || null;
	},

	/**
	 * Normalize a unit label to a compact lookup key
	 * @param {string} unit - Unit label (e.g., μg/m³)
	 * @returns {string} Normalized key
	 */
	normalizeUnitKey(unit) {
		if (!unit) {
			return "";
		}

		let normalized = unit.toLowerCase();
		normalized = normalized.replace(/µ|μ/g, "u");
		normalized = normalized.replace(/³/g, "3");
		normalized = normalized.replace(/²/g, "2");
		normalized = normalized.replace(/[^a-z0-9]/g, "");
		return normalized;
	},

	/**
	 * Build API query parameters
	 * @returns {string} Query string
	 */
	getParams() {
		const params = new URLSearchParams({
			token: this.config.token,
		});

		if (this.config.debug) {
			Log.info(`${this.name} API params:`, params.toString());
		}

		return `?${params.toString()}`;
	},

	/**
	 * Schedule the next update
	 * @param {number} delay - Delay in milliseconds
	 */
	scheduleUpdate(delay) {
		const nextLoad = delay !== undefined ? delay : this.config.updateInterval;

		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(() => {
			this.updateAQI();
		}, nextLoad);
	},

	/**
	 * Handle socket notifications from node helper
	 * @param {string} notification - Notification type
	 * @param {object} payload - Notification data
	 */
	socketNotificationReceived(notification, payload) {
		if (payload.identifier !== this.identifier) {
			return;
		}

		switch (notification) {
			case "AQI_DATA":
				this.processAQI(payload.data);
				this.scheduleUpdate();
				break;

			case "AQI_ERROR":
				this.processError(payload.error);
				this.scheduleUpdate();
				break;
		}
	},

	/**
	 * Suspend module updates
	 */
	suspend() {
		this.suspended = true;
		clearTimeout(this.updateTimer);
		Log.info(`${this.name} suspended`);
	},

	/**
	 * Resume module updates
	 */
	resume() {
		this.suspended = false;
		this.updateAQI();
		Log.info(`${this.name} resumed`);
	},
});
