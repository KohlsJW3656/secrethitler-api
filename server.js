const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const mysql = require("mysql");
const fs = require("fs");
const server = require("http").createServer(app);

let credentials = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
let connection = mysql.createConnection(credentials);
connection.connect();

const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://secrethitleronline.duckdns.org"],
    methods: ["GET", "POST"],
  },
});

let socketCount = 0;
let allPolicies = [];

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

io.on("connection", (socket) => {
  socketCount++;
  io.sockets.emit("users-conneceted", socketCount);
  console.log("Users connected", socketCount);

  socket.on("disconnect", function () {
    socketCount--;
    io.sockets.emit("users-conneceted", socketCount);
    console.log("Users connected", socketCount);
  });

  socket.on("get-policies", () => {
    connection
      .query("SELECT * FROM policy ORDER BY deckOrder ASC")
      .on("result", (row) => {
        allPolicies.push(row);
      })
      .on("end", () => {
        socket.broadcast.emit("receive-changes", allPolicies);
      });
  });
});

server.listen(3445, () => {
  console.log("Server started");
});
