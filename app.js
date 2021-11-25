const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

var allowedOrigins = [
  "https://secrethitleronline.duckdns.org",
  "https://www.secrethitleronline.duckdns.org",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", require("./routes"));

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://secrethitleronline.duckdns.org"],
    methods: ["GET", "POST"],
  },
});
let socketCount = 0;
let allPolicies = [];

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

const PORT = 3445;

app.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});

module.exports = app;