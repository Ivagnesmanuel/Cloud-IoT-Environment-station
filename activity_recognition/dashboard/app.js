import { firebaseConfig } from './config.js'
firebase.initializeApp(firebaseConfig);
const db =  firebase.firestore();

const values = document.querySelector('#values');

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp);
    var year = a.getFullYear();
    var month = a.getMonth();
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + '/' + month + '/' + year + ' [' + hour + ':' + min + ':' + sec + ']';
    return time;
}

function renderValue(doc){
    var row = values.insertRow(0);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(3);
    cell1.innerHTML = timeConverter(doc.data().date);
    cell2.innerHTML = doc.data().status;
    cell3.innerHTML = doc.data().x;
    cell4.innerHTML = doc.data().y;
    cell5.innerHTML = doc.data().z;
}


// getting data (real time)
db.collection('telemetries').orderBy('date').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(element => {
        renderValue(element.doc);
    })
});

