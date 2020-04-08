const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//load models
require('./../models/Temperature');
require('./../models/Humidity');
require('./../models/Direction');
require('./../models/Intensity');
require('./../models/Height');
const Temperature = mongoose.model('temperatureValues');
const Humidity = mongoose.model('humidityValues');
const Direction = mongoose.model('directionValues');
const Intensity = mongoose.model('intensityValues');
const Height = mongoose.model('heightValues');


//index route
router.get('/', (req,res) => {
    res.render('index/home');
})

////////////////////  hour devices routes ////////////////////
router.get('/temperature', (req,res) => {
    //gets only telemetry associated to the device
    Temperature.find({
      date:{$gt:new Date(Date.now() - 60*60 * 1000)}    //restricted to the last hour
    })
      .sort({date:'desc'})
      .then(metrics => {
        res.render('index/temperature', {
          metrics:metrics,
          total:true
    });
  });
})

router.get('/humidity', (req,res) => {
  Humidity.find({
    date:{$gt:new Date(Date.now() - 60*60 * 1000)}
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/humidity', {
        metrics:metrics,
        total:true
  });
});
})

router.get('/direction', (req,res) => {
  Direction.find({
    date:{$gt:new Date(Date.now() - 60*60 * 1000)}
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/direction', {
        metrics:metrics,
        total:true
  });
});
})

router.get('/intensity', (req,res) => {
  Intensity.find({
    date:{$gt:new Date(Date.now() - 60*60 * 1000)}
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/intensity', {
        metrics:metrics,
        total:true
  });
});
})

router.get('/height', (req,res) => {
  Height.find({
    date:{$gt:new Date(Date.now() - 60*60 * 1000)}
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/height', {
        metrics:metrics,
        total:true
  });
});
})




//////////////////// everything devices routes ////////////////////
router.get('/temptotal', (req,res) => {
    //gets only telemetry associated to the device
    Temperature.find({
    })
      .sort({date:'desc'})
      .then(metrics => {
        res.render('index/temperature', {
          metrics:metrics,
          total:false
    });
  });
})

router.get('/humtotal', (req,res) => {
  Humidity.find({
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/humidity', {
        metrics:metrics,
        total:false
  });
});
})

router.get('/dirtotal', (req,res) => {
  Direction.find({
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/direction', {
        metrics:metrics,
        total:false
  });
});
})

router.get('/inttotal', (req,res) => {
  Intensity.find({
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/intensity', {
        metrics:metrics,
        total:false
  });
});
})

router.get('/heitotal', (req,res) => {
  Height.find({
  })
    .sort({date:'desc'})
    .then(metrics => {
      res.render('index/height', {
        metrics:metrics,
        total:false
  });
});
})



module.exports = router;
