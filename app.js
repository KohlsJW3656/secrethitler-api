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
    origin: (origin, callback) => {
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

app.use((req, res, next) => {
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
const connectedUsers = new Map();

const contains = (map, val) => {
  for (let v of map.values()) {
    if (v === val) {
      return true;
    }
  }
  return false;
};

/* Gets all lobbies a user is in */
const getUserLobbies = (userId) => {
  const query =
    "SELECT game.game_id, game_user_id, username FROM game JOIN game_user ON game.game_id = game_user.game_id WHERE start_time IS NULL AND user_id = ?";
  const params = [userId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result);
    });
  });
};

/* Grabs all users from a game */
const getGameUsers = (gameId) => {
  const query =
    "SELECT * FROM game_user WHERE game_id = ? ORDER BY username ASC";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result);
    });
  });
};

const checkGameLobbyStatus = (gameId) => {
  const query =
    "SELECT * FROM game WHERE game.game_id = ? && game.start_time IS NULL";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }

      if (result.length === 0) {
        //No game exists with id that is a lobby
        return resolve(false);
      } else {
        //A game exists with id that is a lobby
        return resolve(true);
      }
    });
  });
};

/* Deletes a user from a lobby */
const deleteUserFromLobby = (gameUserId) => {
  const query = "DELETE FROM game_user WHERE game_user_id = ?";
  const params = [gameUserId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }

      if (result.affectedRows === 0) {
        return resolve(false);
      } else {
        return resolve(true);
      }
    });
  });
};

const disconnect = async (socket) => {
  let userLobbies = await getUserLobbies(connectedUsers.get(socket.id));
  if (!userLobbies) return;

  userLobbies.map(async (userLobby) => {
    let deleted = await deleteUserFromLobby(userLobby.game_user_id);
    if (deleted) {
      /* Grab all users in game */
      let result = await getGameUsers(userLobby.game_id);
      if (result) {
        /* Send updated list of game users to lobby */
        io.to(userLobby.game_id).emit("connectToRoom", {
          result,
        });
        socket.leave(userLobby.game_id);
        console.log(userLobby.username + " has left Game " + userLobby.game_id);
      }
    }
  });

  connectedUsers.delete(socket.id);
  console.table(connectedUsers.values());
  io.sockets.emit("users-connected", connectedUsers.size);
  console.log("Users connected", connectedUsers.size);
};

io.on("connection", (socket) => {
  socket.on("login", (data) => {
    let userId = data.user_id;
    /* First login, add them to the map */
    if (!contains(connectedUsers, userId)) {
      connectedUsers.set(socket.id, userId);
      io.to(socket.id).emit("login");
      io.sockets.emit("users-connected", connectedUsers.size);
      console.log("Users connected", connectedUsers.size);
      console.table(connectedUsers.values());
    } else {
      /* User is already logged in, prevent the login */
      io.to(socket.id).emit("logout", "User already logged in");
      console.log("User " + userId + " attempted to login twice!");
    }
  });

  socket.on("join-game", async (data) => {
    let username = data.username;
    let gameId = data.game_id;

    let result = await getGameUsers(gameId, username);
    if (result) {
      socket.join(gameId);
      console.log(username + " has joined Game " + gameId);

      /* Send updated list of game users to lobby */
      io.to(gameId).emit("connectToRoom", {
        result,
      });
    }
  });

  socket.on("leave-game", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.gameUserId;
    let username = data.username;

    let isLobby = await checkGameLobbyStatus(gameId);
    if (!isLobby) return;

    /* Delete user from game */
    await new Promise((resolve, reject) => {
      const query2 = "DELETE FROM game_user WHERE game_user_id = ?";
      const params2 = [gameUserId];

      connection.query(query2, params2, (error, result) => {
        if (error) {
          return reject();
        } else {
          return resolve(result);
        }
      });
    });

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (result) {
      /* Send updated list of game users to lobby */
      io.to(gameId).emit("connectToRoom", {
        result,
      });
      socket.leave(gameId);
      console.log(username + " has left Game " + gameId);
    }
  });

  socket.on("logout", () => disconnect(socket));
  socket.on("disconnect", () => disconnect(socket));
});

const PORT = 3445;

server.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});

module.exports = server;
