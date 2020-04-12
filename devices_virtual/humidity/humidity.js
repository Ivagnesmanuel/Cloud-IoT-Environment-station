const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

// SETUP
const projectId = `iot-assign1`;
const deviceId = `humidity`;
const registryId = `my-registry`;
const region = `europe-west1`;
const algorithm = `RS256`;
const privateKeyFile = `./rsa_private.pem`;
const mqttBridgeHostname = `mqtt.googleapis.com`;
const mqttBridgePort = 8883;
const messageType = `events`;
const numMessages = 5;


// Random numbers generator over uniform distribution
function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


console.log('****************** Humidity sensor ******************');

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


// Function to publish messages asynchronously
const publishAsync = (
  mqttTopic,
  client,
  iatTime,
  messagesSent,
  connectionArgs
) => {
  setTimeout(() => {
    const humidity = getRandomArbitrary(0, 100);
    var date = parseInt(Date.now());
    const payload = "virtual: "+deviceId+" "+humidity+": "+date;

    // Publish "payload" to the MQTT topic. qos=1 means at least once delivery.
    console.log('Publishing message  => ', payload);
    client.publish(mqttTopic, payload, {qos: 1});

    publishAsync(mqttTopic, client, iatTime, 1, connectionArgs);
  }, 10000);
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

  // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  // Config updates are recommended to use QoS 1 (at least once delivery)
  client.subscribe(`/devices/${deviceId}/config`, {qos: 1});

  // Subscribe to the /devices/{device-id}/commands/# topic to receive all
  // commands or to the /devices/{device-id}/commands/<subfolder> to just receive
  // messages published to a specific commands folder; we recommend you use
  // QoS 0 (at most once delivery)
  client.subscribe(`/devices/${deviceId}/commands/#`, {qos: 0});

  // The MQTT topic that this device will publish data to. The MQTT topic name is
  // required to be in the format below. The topic name must end in 'state' to
  // publish state and 'events' to publish telemetry. Note that this is not the
  // same as the device registry's Cloud Pub/Sub topic.
  const mqttTopic = `/devices/${deviceId}/${messageType}`;

  client.on('connect', success => {
    console.log('connect');
    if (!success) {
      console.log('Client not connected...');
    } else {
      publishAsync(mqttTopic, client, iatTime, 1, connectionArgs);
    }
  });

  client.on('close', () => {
    console.log('close');
  });

  client.on('error', err => {
    console.log('error', err);
  });

  client.on('message', (topic, message) => {
    let messageStr = 'Message received: ';
    if (topic === `/devices/${deviceId}/config`) {
      messageStr = 'Config message received: ';
    } else if (topic.startsWith(`/devices/${deviceId}/commands`)) {
      messageStr = 'Command message received: ';
    }
    messageStr += Buffer.from(message, 'base64').toString('ascii');
    console.log(messageStr);
  });
