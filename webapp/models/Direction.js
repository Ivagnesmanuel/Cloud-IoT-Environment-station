const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema
const DirectionSchema = new Schema({
  deviceId:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:'devices'
  },
  value:{
    type: String,
    required: true
  },
  date:{
    type: Date,
    required: true
  }
});

//create model
mongoose.model('directionValues', DirectionSchema);
