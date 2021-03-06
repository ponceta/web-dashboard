var ESRequest = require('../lib/ElasticSearchRequests.js');
var moment = require('moment');
var tenMinutes = 10 * 60 * 1000;

// if we are at e.g. 17:40 the last bar will only contain
// the amount of clicks from 17:30-17:40, thus being in
// average 3 times to low. thus we have to provide the
// last counter manually.
var parseData = function(data, last_count) {
  var midnight = moment().hour(0).minute(0).second(0);
  var graph = [];

  data.sort(function(a, b) {
    if (a.time < b.time)
      return -1;
    if (a.time > b.time)
      return 1;
    return 0;
  });

  for (i in data) {
    entry = data[i];
    m = moment(entry.time);
    graph.push({
      // the time value is given in seconds. we subtract 30
      // minutes in order for the x achis to look synced.
      x: (entry.time - midnight.valueOf()) / 1000 + 30 * 60,
      y: entry.count
    });
  }

  //we replace the last entry.
  last = graph.pop();
  graph.push({ x: last.x, y: last_count});

  return graph;
};


var sendEvent = function() {
  var graphData = false;
  var lastData = false;
  var finished = function() {
    if (graphData !== false && lastData !== false) {
      var points = parseData(graphData, Math.round(lastData));
      send_event('mapVisits', {points: points});
    }
  };
  ESRequest.getMapVisitsHistogram(function(data) {
    graphData = data;
    finished();
  });

  ESRequest.visitsPerHour(function(data) {
    lastData = data / 2;
    finished();
  });
};

sendEvent();
setInterval(function() {
  sendEvent();
}, 30 * 1000);
