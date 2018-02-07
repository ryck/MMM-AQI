/* Magic Mirror Module: MMM-AQI
 * Version: 1.0.0
 *
 * By Ricardo Gonzalez https://github.com/ryck/MMM-AQI
 * MIT Licensed.
 */
Module.register("MMM-AQI", {
	defaults: {
    token: "",
    updateInterval: 60 * 60 * 1000, // Every hour.
    initialLoadDelay: 0, // No delay/
    animationSpeed: 1000, // One second.
		debug: false

	},
  start: function() {
    Log.info('Starting module: ' + this.name);
    this.loaded = false;
    this.result = null;
    this.scheduleUpdate(this.config.initialLoadDelay);
    this.updateTimer = null;
    this.apiBase = "https://api.waqi.info/feed/here/";
    this.url = encodeURI(this.apiBase + this.getParams());
    if(this.config.debug) {
      Log.info(this.url);
    }

    this.updateAQI(this);

  },
	// updateAQI
	updateAQI: function(self) {
		self.sendSocketNotification("GET_AQI", {"url":self.url});
	},

	getStyles: function() {
		return ["MMM-AQI.css", "font-awesome.css", "weather-icons.css"];
	},
	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},
	//Define header for module.
	getHeader: function() {
		return this.config.header;
	},

// Override dom generator.
  getDom: function() {
    var wrapper = document.createElement("div");

    if (this.config.sensorPin === "") {
      wrapper.innerHTML = "Please set the API token.";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.loaded) {
      wrapper.innerHTML = "Loading Air Quality Index (AQI)...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    // Start building table.
    var dataTable = document.createElement("table");
    dataTable.className = "small";

    var tempRow = document.createElement("tr");;
    var humidRow = document.createElement("tr");;

    if (this.temperature != null && this.humidity != null) {
      var temperatureCell = document.createElement("td");
      temperatureCell.className = "data temperature ";

      // Get a 40C ratio value to set the thermometer icon scale.
      var temperatureRatio = this.temperature / this.config.relativeScale;

      var degreeLabel = "";
      switch (this.config.units ) {
        case "metric":
          degreeLabel = "C";
          break;
        case "imperial":
          degreeLabel = "F";
          break;
        case "default":
          degreeLabel = "C";
          break;
      }

      // Asign themomether icon.
      switch (true) {
        case temperatureRatio < 0:
          if(this.config.debug) {
            Log.info("thermometer-empty " + this.temperature + " - " + temperatureRatio);
          }
          temperatureCell.className += "thermometer-empty";
          break;
        case temperatureRatio >= 0 && temperatureRatio < 0.25:
          if(this.config.debug) {
            Log.info("thermometer-quarter " + this.temperature + " - " + temperatureRatio);
          }
          temperatureCell.className += "thermometer-quarter";
          break;
        case temperatureRatio >= 0.25 && temperatureRatio < 0.5:
          if(this.config.debug) {
            Log.info("thermometer-half " + this.temperature + " - " + temperatureRatio);
          }
          temperatureCell.className += "thermometer-half";
          break;
        case temperatureRatio >= 0.5 && temperatureRatio < 0.75:
          if(this.config.debug) {
            Log.info("thermometer-three-quarters " + this.temperature + " - " + temperatureRatio);
          }
          temperatureCell.className += "thermometer-three-quarters";
          break;
        case temperatureRatio > 0.75:
          if(this.config.debug) {
            Log.info("thermometer-full " + this.temperature + " - " + temperatureRatio);
          }
          temperatureCell.className += "thermometer-full";
          break;
      }

      temperatureCell.innerHTML = " " + this.temperature + " " + degreeLabel;
      tempRow.appendChild(temperatureCell);

      var humidityCell = document.createElement("td");
      humidityCell.className = "data humidity";
      humidityCell.innerHTML = " " + this.humidity + " %";
      humidRow.appendChild(humidityCell);

      dataTable.appendChild(tempRow);
      dataTable.appendChild(humidRow);
    } else {
      var row1 = document.createElement("tr");
      dataTable.appendChild(row1);

      var messageCell = document.createElement("td");
      messageCell.innerHTML = "No data returned";
      messageCell.className = "bright";
      row1.appendChild(messageCell);
    }
    wrapper.appendChild(dataTable);
    return wrapper;
  },
  processAQI: function(result) {
    if (typeof result !== "undefined" && result !== null) {
      if(this.config.debug) {
        Log.info(result);
      }
      this.loaded = true;
      this.result = result;
      this.updateDom(this.config.animationSpeed);
    }
  },
	getParams: function() {
		var params = "?";
		params += "token=" + this.config.token;
		if(this.config.debug) {
			Log.info(params);
		}
		return params;
	},
	/* scheduleUpdate()
	 * Schedule next update.
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateAQI(self);
		}, nextLoad);
	},
	// Process data returned
	socketNotificationReceived: function(notification, payload) {
	    if (notification === "AQI_DATA" && payload.url === this.url) {
		this.processAQI(payload.data);
		this.scheduleUpdate(this.config.updateInterval);
	    }
	  }
});
