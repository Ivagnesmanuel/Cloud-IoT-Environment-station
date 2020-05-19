const moment = require('moment');

//usefull helpers
module.exports = {
  //to remove html tags
  stripTags: function(input){
    return input.replace(/<(?:.|\n)*?>/gm, '');
  },
  //to make dates looks better
  formatDate: function(date, format){
    return moment(date).format(format);
  }
}
