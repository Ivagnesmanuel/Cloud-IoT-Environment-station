const express = require('express');
const socket = require('socket.io');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');


var app = express();
var server = require('http').createServer(app);     //needed for websocket
var io = require('socket.io')(server);



// SETUP
const projectId = `activity-46746`;
const deviceId = `activity-device`;
const registryId = `my-register`;
const region = `europe-west1`;
const algorithm = `RS256`;
const privateKeyFile = `./rsa_private.pem`;
const mqttBridgeHostname = `mqtt.googleapis.com`;
const mqttBridgePort = 8883;
const messageType = `events`;
const numMessages = 5;


//////////////////////////////   Google publish code  ////////////////////////////////////////


// Create a Cloud IoT Core JWT for the given project id, signed with the given private key.
// code taken from google examples
const createJwt = (projectId, privateKeyFile, algorithm) => {

  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: projectId,
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, {algorithm: algorithm});
};


// The mqttClientId is a unique string that identifies this device. For Google
// Cloud IoT Core, it must be in the format below.
const mqttClientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;
// With Google Cloud IoT Core, the username field is ignored, however it must be
// non-empty. The password field is used to transmit a JWT to authorize the
// device. The "mqtts" protocol causes the library to connect using SSL, which
// is required for Cloud IoT Core.
const connectionArgs = {
  host: mqttBridgeHostname,
  port: mqttBridgePort,
  clientId: mqttClientId,
  username: 'unused',
  password: createJwt(projectId, privateKeyFile, algorithm),
  protocol: 'mqtts',
  secureProtocol: 'TLSv1_2_method',
};

// Create a client, and connect to the Google MQTT bridge.
const iatTime = parseInt(Date.now() / 1000);
const client = mqtt.connect(connectionArgs);

// The MQTT topic that this device will publish data to. The MQTT topic name is
// required to be in the format below. The topic name must end in 'state' to
// publish state and 'events' to publish telemetry. Note that this is not the
// same as the device registry's Cloud Pub/Sub topic.
const mqttTopic = `/devices/${deviceId}/${messageType}`;

client.on('connect', success => {
  console.log('connect');
  if (!success) {
    console.log('Client not connected...');
  }
});

client.on('close', () => {
  console.log('close');
});

client.on('error', err => {
  console.log('error', err);
});

/////////////////////////////////////////////////////////////////////////////////////////////

app.set('view engine', 'ejs');
app.get('/', (req,res) => {
    res.render('index.ejs');
})


io.on('connection', (socket) => {
  socket.on('accelerometer', (message) => {
    payload = JSON.stringify(message)
    client.publish(mqttTopic, payload, {qos: 1});
    console.log('published: ' + payload);
  })
});


const port = process.env.PORT || 3000;
server.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
});
