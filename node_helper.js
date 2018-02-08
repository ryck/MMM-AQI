/* TfL Bus Atrival Predictions */

/* Magic Mirror
 * Module: MMM-AQI
 * By Ricardo Gonzalez
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
	start: function() {
		console.log("MMM-AQI helper started ...");
	},
	/* getAQIData()
	 * Requests new data from AirNow API.
	 * Sends data back via socket on succesfull response.
	 */
	getAQIData: function(url) {
		var self = this;
		var retry = true;

		request({ url: url, method: "GET" }, function(error, response, body) {
			// Lets convert the body into JSON
			var result = JSON.parse(body);
			if (!error && response.statusCode == 200) {
				if (result.status == "error") {
					self.sendSocketNotification("AQI_DATA", { data: null, url: url });
				} else {
					self.sendSocketNotification("AQI_DATA", { data: result, url: url });
				}
			} else {
				self.sendSocketNotification("AQI_DATA", { data: null, url: url });
			}
		});
	},
	//Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_AQI") {
			this.getAQIData(payload.url);
		}
	}
});
