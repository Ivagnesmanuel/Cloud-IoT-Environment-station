const path = require('path');                       //for path navigation
const exphbs = require('express-handlebars');       //front-end
const bodyParser = require('body-parser');          //to access at req.value
const methodOverride = require('method-override');  //needs for edit and delete
const {PubSub} = require('@google-cloud/pubsub');   //google cloud pub/sub module
const mongoose = require('mongoose')                //database service
const express = require('express');


var app = express();
var server = require('http').createServer(app);     //needed for websocket
var io = require('socket.io')(server);

const port = process.env.PORT || 3000;
server.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
} );


//load routes
const index = require('./routes/index');
app.use('/', index)

//load keys
const keys = require('./config/keys.js');

//connect to mongoose
mongoose.connect(keys.mongoURI, {
  useUnifiedTopology: true,
 useNewUrlParser: true,
})
  .then(() => console.log('MongoDb Connected'))      //use promise instead of callbacks for cleaner code
  .catch(err => console.log(err));

//load models
require('./models/Temperature');
require('./models/Humidity');
require('./models/Direction');
require('./models/Intensity');
require('./models/Height');
const Temperature = mongoose.model('temperatureValues');
const Humidity = mongoose.model('humidityValues');
const Direction = mongoose.model('directionValues');
const Intensity = mongoose.model('intensityValues');
const Height = mongoose.model('heightValues');


//////////////////// google code for MQTT Asynchronous Pull ////////////////////
// Creates a client; cache this for further use
const pubSubClient = new PubSub();
const subscriptionName = 'projects/iot-assign1/subscriptions/my-subscription';

function listenForMessages() {
  try {
    // References an existing subscription
    const subscription = pubSubClient.subscription(subscriptionName);

    // Create an event handler to handle messages
    const messageHandler = message => {
      console.log(`Received message ${message.id}:`);
      console.log(`\tData: ${message.data}`);
      var payload = `${message.data}`.split(" ");

      // create the new Telemetry object
      const newTelemetry = {
        value: payload[1],
        date: payload[2]
      }

      // needed for the interactive home page
      if(payload[0] == "temperature"){                      //recognition by deviceID
        io.emit("temperature", payload[1]+" "+payload[2]);  //value time
        new Temperature(newTelemetry).save();
      }

      if(payload[0] == "humidity"){
        io.emit("humidity", payload[1]+" "+payload[2]);
        new Humidity(newTelemetry).save();
      }


      if(payload[0] == "direction"){
        io.emit("direction", payload[1]+" "+payload[2]);
        new Direction(newTelemetry).save();
      }


      if(payload[0] == "intensity"){
        io.emit("intensity", payload[1]+" "+payload[2]);
        new Intensity(newTelemetry).save();
      }


      if(payload[0] == "height"){
        io.emit("height", payload[1]+" "+payload[2]);
        new Height(newTelemetry).save();
      }


      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);

  } catch(err) {
    console.log(err)
  }
}
listenForMessages();


//////////////////// socket.io functions to retrive data for charts ////////////////////
const temp = io.of('/tempView');
temp.on('connection', function(socket){
  const values = Temperature.find(
    {date:{$gt:new Date(Date.now() - 60*60 * 1000)}}
  ).sort({date:'asc'}).then(values => {
    temp.emit("temperatureTele", values)
  })
});


const hum = io.of('/humView');
hum.on('connection', function(socket){
  const values = Humidity.find(
    {date:{$gt:new Date(Date.now() - 60*60 * 1000)}}
  ).sort({date:'asc'}).then(values => {
    hum.emit("humidityTele", values)
  })
});


const dire = io.of('/direView');
dire.on('connection', function(socket){
  const values = Direction.find(
    {date:{$gt:new Date(Date.now() - 60*60 * 1000)}}
  ).sort({date:'asc'}).then(values => {
    dire.emit("directionTele", values)
  })
});


const inte = io.of('/inteView');
inte.on('connection', function(socket){
  const values = Intensity.find(
    {date:{$gt:new Date(Date.now() - 60*60 * 1000)}}
  ).sort({date:'asc'}).then(values => {
    inte.emit("intensityTele", values)
  })
});


const rain = io.of('/rainView');
rain.on('connection', function(socket){
  const values = Height.find(
    {date:{$gt:new Date(Date.now() - 60*60 * 1000)}}
  ).sort({date:'asc'}).then(values => {
    rain.emit("rainTele", values)
  })
});




//handlebars helpers
const {
  stripTags,
  formatDate
} = require('./helpers/hbs');

//handlebars middleware
app.engine('handlebars', exphbs({
  helpers: {
    stripTags: stripTags,
    formatDate: formatDate
},
defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//method override middleware
app.use(methodOverride('_method'));
