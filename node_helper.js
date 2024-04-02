/* MagicMirror²
 * Module: MMM-AQI
 * By Ricardo Gonzalez
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var axios = require("axios");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-AQI helper started ...");
  },
  /* getAQIData()
   * Requests new data from AirNow API.
   * Sends data back via socket on succesfull response.
   */
  getAQIData: async function (url) {
    var self = this;

    const { data, status, statusText } = await axios.get(url);
    if (status == 200) {
      if (statusText == "error") {
        self.sendSocketNotification("AQI_DATA", { data: null, url });
      } else {
        self.sendSocketNotification("AQI_DATA", {
          data,
          url,
        });
      }
    } else {
      self.sendSocketNotification("AQI_DATA", { data: null, url });
    }
  },

  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_AQI") {
      this.getAQIData(payload.url);
    }
  },
});
