const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema
const HeightSchema = new Schema({
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
mongoose.model('heightValues', HeightSchema);
