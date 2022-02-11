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
const { allPolicies1 } = require("./controllers/policy");
const connection = require("./connection");
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

io.on("connection", (socket) => {
  socketCount++;
  io.sockets.emit("users-conneceted", socketCount);
  console.log("Users connected", socketCount);

  socket.on("join-game", (data) => {
    let username = data.username;
    let gameId = data.game_id;
    const query =
      "SELECT * FROM game_user WHERE game_user.game_id = ? ORDER BY username ASC";
    const params = [gameId];

    connection.query(query, params, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        socket.join(gameId);
        console.log(username + " has joined Game " + gameId);

        io.to(gameId).emit("connectToRoom", {
          result,
        });
      }
    });
  });

  socket.on("disconnect", () => {
    // const { user } = socket;
    // if (user) {
    //   gameUsers.pop();
    //   io.to(socket.room).emit("connectToRoom", {
    //     gameUsers,
    //   });
    // }
    socketCount--;
    io.sockets.emit("users-conneceted", socketCount);
    console.log("Users connected", socketCount);
  });
});

const PORT = 3445;

server.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});

module.exports = server;
