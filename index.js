const express = require('express');
const app = express();

app.set('view engine', 'ejs');
let https = require('https');

app.get('/getweather', (req, res) => { 
  res.render('form');
});

let options = { headers : { 'User-Agent': 'Forecast' } };
let temperatures = [];
let bool = true

app.get('/getweather/:latitude/:longitude', 
  function (req, res, next) {
    res.locals.temperatures = []
    res.locals.bool = true
    let { latitude, longitude } = req.params
    let firstURL = `https://api.weather.gov/points/${latitude},${longitude}`;
    https.get(firstURL, options, (response) => {
      if (response.statusCode !== 200) {
        bool = false
        return res.redirect('/getweather/results')
      }
      let aggregatedResponseString = '';
      response.on('data', (chunk) => {
        aggregatedResponseString += chunk;
      });
      response.on('end', () => {
        let data = JSON.parse(aggregatedResponseString);
        let forecastURL = data.properties.forecast;
        res.locals.forecastURL = forecastURL
        if (forecastURL === null) {
          bool = false
          return res.redirect('/getweather/results')
        }
        res.locals.temperatures.push(data.properties.relativeLocation.properties.city)
        res.locals.temperatures.push(data.properties.relativeLocation.properties.state)
        next()
      });
    });
  },
  function (req, res) {
    forecastURL = res.locals.forecastURL
    https.get(forecastURL, options, (response) => {
      if (response.statusCode !== 200) {
        bool = false
        return res.redirect('/getweather/results')
      }
      let aggregatedResponseString = '';
      response.on('data', (chunk) => {
        aggregatedResponseString += chunk;
      });
      response.on('end', () => {
        let data = JSON.parse(aggregatedResponseString);
        for (let i = 0; i < data.properties.periods.length; i++) {
          res.locals.temperatures.push(data.properties.periods[i].name);
          res.locals.temperatures.push(data.properties.periods[i].temperature);
          res.locals.temperatures.push(data.properties.periods[i].detailedForecast);
        }
        temperatures = res.locals.temperatures
        bool = res.locals.bool
        res.redirect('/getweather/results')
      });
    });
  }
);

app.get('/getweather/results', (req, res) => {
  if (bool)
    res.render('results', { temperatures: temperatures });
  else {
    bool = true
    res.render('error');
  }
})

const listener = app.listen(
  process.env.PORT || 8080,
  process.env.HOST || "0.0.0.0",
  function() {
    console.log("Express server started");
});
