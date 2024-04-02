/* MagicMirror²
 * Module: MMM-AQI
 * By Ricardo Gonzalez
 * MIT Licensed.
 */

const Log = require("logger");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    Log.log("MMM-AQI helper started ...");
  },
  /* getAQIData()
   * Requests new data from AirNow API.
   * Sends data back via socket on succesfull response.
   */
  async getAQIData (url) {
    const self = this;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        self.sendSocketNotification("AQI_DATA", {
          data,
          url,
        });
      } else {
        self.sendSocketNotification("AQI_DATA", {data: null, url});
      }
    } catch (error) {
      self.sendSocketNotification("AQI_DATA", {data: null, url});
    }
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived (notification, payload) {
    if (notification === "GET_AQI") {
      this.getAQIData(payload.url);
    }
  },
});
