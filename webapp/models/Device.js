const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema for devices
const DeviceSchema = new Schema({
  deviceId:{
    type: String,
    required: true
  },
  temperature: [{
    type: Schema.Types.ObjectId, ref:'temperatureValues'
  }],
  humidity: [{
    type: Schema.Types.ObjectId, ref:'humidityValues'
  }],
  direction: [{
    type: Schema.Types.ObjectId, ref:'directionValues'
  }],
  intensity: [{
    type: Schema.Types.ObjectId, ref:'intensityValues'
  }],
  height: [{
    type: Schema.Types.ObjectId, ref:'heightValues'
  }]
});

//create model
mongoose.model('devices', DeviceSchema);
