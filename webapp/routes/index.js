const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//load model
require('./../models/Telemetry');
const Telemetry = mongoose.model('telemetries');


//index route
router.get('/', (req,res) => {
    res.render('index/home');
})


////////////////////  hour devices routes //////////////////// 
router.get('/temperature', (req,res) => {
    //gets only telemetry associated to the device
    Telemetry.find({
      device: 'temperature',
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
  Telemetry.find({
    device: 'humidity',
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
  Telemetry.find({
    device: 'direction',
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
  Telemetry.find({
    device: 'intensity',
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
  Telemetry.find({
    device: 'height',
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
    Telemetry.find({
      device: 'temperature'
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
  Telemetry.find({
    device: 'humidity',
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
  Telemetry.find({
    device: 'direction',
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
  Telemetry.find({
    device: 'intensity',
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
  Telemetry.find({
    device: 'height',
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
