// This file is no longer needed and will be removed.
var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://schoolflow-731q1-default-rtdb.firebaseio.com"
});
