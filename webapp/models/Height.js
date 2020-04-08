const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema
const HeightSchema = new Schema({
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
