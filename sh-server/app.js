const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

let credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
let connection = mysql.createConnection(credentials);
connection.connect();

function rowToPolicy(row) {
  return {
    policy_id: row.policy_id,
    type: row.type,
    deckOrder: row.deckOrder,
    isDiscarded: row.isDiscarded,
    isEnacted: row.isEnacted,
  };
}

app.get("/policies", (request, response) => {
  const query = "SELECT * FROM policy ORDER BY deckOrder ASC";
  connection.query(query, (error, rows) => {
    response.send({
      ok: true,
      allPolicies: rows.map(rowToPolicy),
    });
  });
});

app.patch("/policy/:policy_id", (request, response) => {
  const query =
    "UPDATE policy SET type = ?, deckOrder = ?, isDiscarded = ?, isEnacted = ? WHERE policy_id = ?";
  const params = [
    request.body.type,
    request.body.deckOrder,
    request.body.isDiscarded,
    request.body.isEnacted,
    request.params.policy_id,
  ];
  connection.query(query, params, (error, result) => {
    response.send({
      ok: true,
    });
  });
});

const port = 3445;
app.listen(port, () => {
  console.log(`We're live on port ${port}!`);
});
