import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
//import * as PubSub from '@google-cloud/pubsub';


const app = admin.initializeApp();
const db = app.firestore();

 
function computeStatus(x, y, z){
    const model = Math.sqrt(x*x + y*y + z*z);
    if (model > 0.6) {
      return 'Walking'
    } else {
      return 'Still'
    }
}

exports.newPubSub = functions.pubsub.topic('my-events').onPublish(async (message) => {
    
  const payload = Buffer.from(message.data, 'base64').toString();
  const telemetry = JSON.parse(payload);

  // Decide if apply the model;
  // For semplicty, on the client, status is associated with a boolean value, 
  // which here becomes a string before storing inside of the database;
  let status = '';
  if (telemetry.status === 0){
      status = 'Still';
  } else if (telemetry.status === 1) {
      status = 'walking';
  } else {
      status = computeStatus(telemetry.accx, telemetry.accy, telemetry.accz);
  }

  // save in the database
  db.collection('telemetries').add({
    'date': telemetry.date,
    'status': status,
    'x': telemetry.accx,
    'y': telemetry.accy,
    'z': telemetry.accz,
  }).then((writeResult) => {
    console.log({'result': 'Message with ID: ' + writeResult.id + ' added.'});
    return;
  }).catch((err) => {
    console.log(err);
    return;
  });
  
});