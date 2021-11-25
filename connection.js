const mysql = require("mysql");
const fs = require("fs");

let credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
let connection = mysql.createConnection(credentials);

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  //console.log("connected as id " + connection.threadId);
});

module.exports = connection;
