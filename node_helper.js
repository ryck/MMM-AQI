/* MagicMirror²
 * Module: MMM-AQI
 * By Ricardo Gonzalez
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	start() {
		Log.log("MMM-AQI helper started ...");
	},

	/**
	 * Fetch AQI data from API with improved error handling
	 * @param {string} url - API endpoint URL
	 * @param {string} identifier - Module identifier for proper routing
	 */
	async getAQIData(url, identifier) {
		try {
			Log.info(`MMM-AQI fetching data for ${identifier}: ${url}`);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch(url, {
				signal: controller.signal,
				headers: {
					"User-Agent": "MagicMirror-MMM-AQI/1.3.0",
					Accept: "application/json",
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			// Validate API response structure
			if (!this.validateAPIResponse(data)) {
				throw new Error("Invalid API response format");
			}

			Log.info(`MMM-AQI data fetched successfully for ${identifier}`);
			this.sendSocketNotification("AQI_DATA", {
				identifier,
				data,
			});
		} catch (error) {
			Log.error(`MMM-AQI fetch error for ${identifier}:`, error.message);

			// Categorize error types for better user feedback
			let errorType = "NETWORK_ERROR";
			let errorMessage = error.message;

			if (error.name === "AbortError") {
				errorType = "TIMEOUT";
				errorMessage = "Request timeout";
			} else if (error.message.includes("HTTP 401")) {
				errorType = "UNAUTHORIZED";
				errorMessage = "Invalid API token";
			} else if (error.message.includes("HTTP 404")) {
				errorType = "NOT_FOUND";
				errorMessage = "City not found";
			} else if (error.message.includes("HTTP 429")) {
				errorType = "RATE_LIMIT";
				errorMessage = "API rate limit exceeded";
			} else if (!navigator.onLine) {
				errorType = "OFFLINE";
				errorMessage = "No internet connection";
			}

			this.sendSocketNotification("AQI_ERROR", {
				identifier,
				error: {
					type: errorType,
					message: errorMessage,
					originalError: error.message,
				},
			});
		}
	},

	/**
	 * Validate API response structure
	 * @param {object} data - API response data
	 * @returns {boolean} True if valid
	 */
	validateAPIResponse(data) {
		if (!data || typeof data !== "object") {
			return false;
		}

		// Check for error response
		if (data.status === "error") {
			Log.warn("MMM-AQI API returned error:", data.data || data.message);
			return false;
		}

		// Check for required fields in successful response
		if (data.status !== "ok" || !data.data) {
			return false;
		}

		const requiredFields = ["aqi", "city"];
		return requiredFields.every((field) => data.data[field] !== undefined);
	},

	/**
	 * Handle socket notifications from frontend
	 * @param {string} notification - Notification type
	 * @param {object} payload - Notification payload
	 */
	socketNotificationReceived(notification, payload) {
		switch (notification) {
			case "GET_AQI":
				if (!payload.url || !payload.identifier) {
					Log.error("MMM-AQI: Missing required parameters");
					return;
				}
				this.getAQIData(payload.url, payload.identifier);
				break;

			default:
				Log.warn(`MMM-AQI: Unknown notification: ${notification}`);
		}
	},

	/**
	 * Clean up resources when stopping
	 */
	stop() {
		Log.log("MMM-AQI helper stopped");
	},
});
