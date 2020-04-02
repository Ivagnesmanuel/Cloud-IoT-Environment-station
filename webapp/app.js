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



//load keys
const keys = require('./config/keys.js');

//connect to mongoose
mongoose.connect(keys.mongoURI, {
  useUnifiedTopology: true,
 useNewUrlParser: true,
})
  .then(() => console.log('MongoDb Connected'))      //use promise instead of callbacks for cleaner code
  .catch(err => console.log(err));

//load model
require('./models/Telemetry');
const Telemetry = mongoose.model('telemetries');



//  websocket + google code for MQTT Asynchronous Pull
io.on('connection', function (socket) {
  //console.log(`websocket started`);
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

        //needed for the interactive home page
        if(payload[0] == "temperature")                      //recognition by deviceID
          io.emit("temperature", payload[1]+" "+payload[2]);  //value time

        if(payload[0] == "humidity")
          io.emit("humidity", payload[1]+" "+payload[2]);

        if(payload[0] == "direction")
          io.emit("direction", payload[1]+" "+payload[2]);

        if(payload[0] == "intensity")
          io.emit("intensity", payload[1]+" "+payload[2]);

        if(payload[0] == "height")
          io.emit("height", payload[1]+" "+payload[2]);

        // "Ack" (acknowledge receipt of) the message
        message.ack();

        //create the new Telemetry object
        const newTelemetry = {
          device: payload[0],
          value: payload[1],
          date: payload[2]
        }

        new Telemetry(newTelemetry)
          .save()
          .then(event => {
          res.redirect('/')
        }).catch(err => console.log('Asynchronous save'));

      };

      // Listen for new messages until timeout is hit
      subscription.on('message', messageHandler);
    } catch(err) {
      console.log(err)
    }
  }

  listenForMessages();
});




//load routes
const index = require('./routes/index');
app.use('/', index)

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
