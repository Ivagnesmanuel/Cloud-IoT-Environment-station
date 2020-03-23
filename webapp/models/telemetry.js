const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema
const TelemetrySchema = new Schema({
  device: {
    type: String,
    required: true
  },
  value:{
    type: String,
    required: true
  },
  date:{
    type: Date,
    required: true
  },
});

//create model
mongoose.model('telemetries', TelemetrySchema);
