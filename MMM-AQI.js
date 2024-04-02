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
    updateInterval: 30 * 60 * 1000, // Every half hour.
    overrideCityDisplayName: null,
    initialLoadDelay: 0, // No delay/
    animationSpeed: 1000, // One second.
    debug: false,
  },
  start () {
    Log.info(`Starting module: ${this.name}`);
    this.loaded = false;
    this.result = null;
    this.scheduleUpdate(this.config.initialLoadDelay);
    this.updateTimer = null;
    this.apiBase = `https://api.waqi.info/feed/${this.config.city}/`;
    this.url = encodeURI(this.apiBase + this.getParams());
    if (this.config.debug) {
      Log.info(this.url);
    }
    this.updateAQI(this);
  },
  // updateAQI
  updateAQI (self) {
    self.sendSocketNotification("GET_AQI", {url: self.url});
  },

  getStyles () {
    return ["MMM-AQI.css", "weather-icons.css"];
  },
  // Define required scripts.
  getScripts () {
    return ["moment.js"];
  },
  // Define header for module.
  getHeader () {
    return this.data.header;
  },

  // Override dom generator.
  getDom () {
    const wrapper = document.createElement("div");

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
    const dataTable = document.createElement("table");
    dataTable.className = "small data";

    if (this.result.data != null) {
      const aqiRow = document.createElement("tr");
      const aqi = this.result.data.aqi;
      const city =
        this.config.overrideCityDisplayName ?? this.result.data.city.name;

      // Asign aqi class name.
      let aqiClass = "";
      switch (true) {
        case aqi <= 0:
          if (this.config.debug) {
            Log.info(`empty - ${aqi}`);
          }
          aqiClass += "empty";
          break;
        case aqi > 0 && aqi < 51:
          if (this.config.debug) {
            Log.info(`good - ${aqi}`);
          }
          aqiClass += "good";
          break;
        case aqi >= 51 && aqi < 101:
          if (this.config.debug) {
            Log.info(`moderate - ${aqi}`);
          }
          aqiClass += "moderate";
          break;
        case aqi >= 101 && aqi < 151:
          if (this.config.debug) {
            Log.info(`unhealthy-sensitive - ${aqi}`);
          }
          aqiClass += "unhealthy-sensitive";
          break;
        case aqi >= 151 && aqi < 201:
          if (this.config.debug) {
            Log.info(`unhealthy - ${aqi}`);
          }
          aqiClass += "unhealthy";
          break;
        case aqi >= 201 && aqi < 300:
          if (this.config.debug) {
            Log.info(`very-unhealthy - ${aqi}`);
          }
          aqiClass += "very-unhealthy";
          break;
        case aqi >= 300:
          if (this.config.debug) {
            Log.info(`hazardous - ${aqi}`);
          }
          aqiClass += "hazardous";
          break;
      }

      const cityCell = document.createElement("td");
      cityCell.className = `city ${aqiClass}`;
      cityCell.innerHTML = city;
      aqiRow.appendChild(cityCell);

      const aqiCell = document.createElement("td");
      aqiCell.className = `aqi ${aqiClass}`;
      aqiCell.innerHTML = aqi;
      aqiRow.appendChild(aqiCell);

      dataTable.appendChild(aqiRow);

      if (this.config.iaqi) {
        const iaqi = this.result.data.iaqi;
        let iaqiRow = "";
        let iaqiCityCell = "";
        let iaqiAQICell = "";

        Object.keys(iaqi).forEach((key) => {
          iaqiRow = document.createElement("tr");

          iaqiCityCell = document.createElement("td");
          iaqiCityCell.className = `xsmall iaqi key ${aqiClass}`;
          iaqiCityCell.innerHTML = key.toUpperCase();
          iaqiRow.appendChild(iaqiCityCell);

          iaqiAQICell = document.createElement("td");
          iaqiAQICell.className = `xsmall iaqi value ${aqiClass}`;
          iaqiAQICell.innerHTML = iaqi[key].v;
          iaqiRow.appendChild(iaqiAQICell);
          dataTable.appendChild(iaqiRow);
        });
      }
    } else {
      const row1 = document.createElement("tr");
      dataTable.appendChild(row1);

      const messageCell = document.createElement("td");
      messageCell.innerHTML = this.result.message;
      messageCell.className = "bright";
      row1.appendChild(messageCell);

      const row2 = document.createElement("tr");
      dataTable.appendChild(row2);

      const timeCell = document.createElement("td");
      timeCell.innerHTML = this.result.timestamp;
      timeCell.className = "bright xsmall";
      row2.appendChild(timeCell);
    }
    wrapper.appendChild(dataTable);
    return wrapper;
  },
  processAQI (result) {
    this.result = {};
    this.result.timestamp = moment().format("LLL");
    if (typeof result !== "undefined" && result != null) {
      if (this.config.debug) {
        Log.info(result);
      }
      this.result.data = result.data;
    } else {
      // No data returned - set error message
      this.result.message = "No data returned";
      this.result.data = null;
      if (this.config.debug) {
        Log.error("No data returned");
        Log.error(this.result);
      }
    }
    this.updateDom(this.config.animationSpeed);
    this.loaded = true;
  },
  getParams () {
    let params = "?";
    params += `token=${this.config.token}`;
    if (this.config.debug) {
      Log.info(params);
    }
    return params;
  },
  /* scheduleUpdate()
   * Schedule next update.
   * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
   */
  scheduleUpdate (delay) {
    let nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }

    const self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      self.updateAQI(self);
    }, nextLoad);
  },
  // Process data returned
  socketNotificationReceived (notification, payload) {
    if (notification === "AQI_DATA" && payload.url === this.url) {
      this.processAQI(payload.data);
      this.scheduleUpdate(this.config.updateInterval);
    }
  },
});
