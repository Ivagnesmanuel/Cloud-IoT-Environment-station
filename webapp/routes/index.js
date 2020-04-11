const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

//load models
require('./../models/Device');
require('./../models/Temperature');
require('./../models/Humidity');
require('./../models/Direction');
require('./../models/Intensity');
require('./../models/Height');
const Device = mongoose.model('devices');
const Temperature = mongoose.model('temperatureValues');
const Humidity = mongoose.model('humidityValues');
const Direction = mongoose.model('directionValues');
const Intensity = mongoose.model('intensityValues');
const Height = mongoose.model('heightValues');


//index route
router.get('/', (req,res) => {
    res.render('index/home');
})


//////////////////// devices telemetry indexs ////////////////////
router.get('/temperatureIndex', (req,res) => {
    //gets only telemetry associated to the device
    Device.find({}).then(devices => {
        res.render('index/temperatureIndex', {
          devices:devices,
    });
  });
})


router.get('/humidityIndex', (req,res) => {
    //gets only telemetry associated to the device
    Device.find({}).then(devices => {
        res.render('index/humidityIndex', {
          devices:devices,
    });
  });
})


router.get('/directionIndex', (req,res) => {
    //gets only telemetry associated to the device
    Device.find({}).then(devices => {
        res.render('index/directionIndex', {
          devices:devices,
    });
  });
})


router.get('/intensityIndex', (req,res) => {
    //gets only telemetry associated to the device
    Device.find({}).then(devices => {
        res.render('index/intensityIndex', {
          devices:devices,
    });
  });
})


router.get('/heightIndex', (req,res) => {
    //gets only telemetry associated to the device
    Device.find({}).then(devices => {
        res.render('index/heightIndex', {
          devices:devices,
    });
  });
})




//////////////////// single device telemetry routes ////////////////////
router.get('/temperature/:id', (req,res) => {
    //gets only telemetry associated to the device
    Temperature.find({
      deviceId:req.params.id
    })
    .sort({date:'desc'})
    .then(metrics => {

      Device.findOne({
         _id:req.params.id
      }).then(device => {

        res.render('index/temperature', {
          metrics:metrics,
          device:device.deviceId
        })
      });
    });
})



router.get('/humidity/:id', (req,res) => {
  Humidity.find({
    deviceId: req.params.id
  })
    .sort({date:'desc'})
    .then(metrics => {

      Device.findOne({
         _id:req.params.id
      }).then(device => {

        res.render('index/humidity', {
          metrics:metrics,
          device:device.deviceId
        })
      });
    });
})

router.get('/direction/:id', (req,res) => {
  Direction.find({
    deviceId: req.params.id
  })
    .sort({date:'desc'})
    .then(metrics => {

      Device.findOne({
         _id:req.params.id
      }).then(device => {

        res.render('index/direction', {
          metrics:metrics,
          device:device.deviceId
        })
      });
    });

})

router.get('/intensity/:id', (req,res) => {
  Intensity.find({
    deviceId: req.params.id
  })
    .sort({date:'desc'})
    .then(metrics => {

      Device.findOne({
         _id:req.params.id
      }).then(device => {

        res.render('index/intensity', {
          metrics:metrics,
          device:device.deviceId
        })
      });
    });
})

router.get('/height/:id', (req,res) => {
  Height.find({
      deviceId: req.params.id,
  })
    .sort({date:'desc'})
    .then(metrics => {

      Device.findOne({
         _id:req.params.id
      }).then(device => {

        res.render('index/height', {
          metrics:metrics,
          device:device.deviceId
        })
      });
    });
})



module.exports = router;
