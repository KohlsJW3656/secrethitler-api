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
const timers = new Map();

const randomizeArray = (array) => {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
};

const getRandomItem = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  const item = array[randomIndex];
  return item;
};

const getKey = (map, value) => [...map].find(([key, val]) => val == value)[0];

const contains = (map, value) => {
  for (let val of map.values()) {
    if (val === value) {
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
    "SELECT game_user.*, role.secret_identity, role.party_membership FROM game_user JOIN role ON game_user.role_id = role.role_id WHERE game_id = ?";
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

/* Grabs all game policies */
const getGamePolicies = (gameId) => {
  const query =
    "SELECT game_policy.*, policy.fascist FROM game_policy JOIN policy ON game_policy.policy_id = policy.policy_id WHERE game_id = ? ORDER BY deck_order ASC";
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

/* Creates game policies */
const createGamePolicies = (
  gameId,
  policyId,
  deckOrder,
  discarded,
  enacted
) => {
  const query =
    "INSERT INTO game_policy (game_id, policy_id, deck_order, discarded, enacted) VALUES (?, ?, ?, ?, ?)";
  const params = [gameId, policyId, deckOrder, discarded, enacted];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result);
    });
  });
};

const deleteGame = (gameId) => {
  const query = "DELETE FROM game WHERE game_id = ?";
  const params = [gameId];

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

/* Toggles a game user's ready status */
const readyGameUser = (gameUserId, ready) => {
  const query = "UPDATE game_user SET ready = ? WHERE game_user_id = ?";
  const params = [ready, gameUserId];

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

/* validates if a game is ready to start and clears the interval if the timer is already going */
const readyToStart = (gameUsers, interval) => {
  let allReady = gameUsers.filter((gameUser) => !gameUser.ready).length === 0;
  if (gameUsers.length < 5 || !allReady) {
    clearInterval(interval);
  }
  return allReady && gameUsers.length >= 5;
};

/* Assigns the start time for a game */
const setStartTime = (gameId) => {
  const query = "UPDATE game SET start_time = NOW() WHERE game_id = ?";
  const params = [gameId];

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

/* Assigns roles to game users in a game */
const assignRole = (gameUserId, roleId) => {
  const query = "UPDATE game_user SET role_id = ? WHERE game_user_id = ?";
  const params = [roleId, gameUserId];

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

/* Casts a ballot */
const castBallot = (gameUserId, ballot) => {
  const query = "UPDATE game_user SET ballot = ? WHERE game_user_id = ?";
  const params = [ballot, gameUserId];

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

/* Assigns a president */
const assignPresident = (gameUserId, value) => {
  const query = "UPDATE game_user SET president = ? WHERE game_user_id = ?";
  const params = [value, gameUserId];

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

/* Assigns prev president */
const assignPrevPresident = (gameUserId, value) => {
  const query =
    "UPDATE game_user SET prev_president = ? WHERE game_user_id = ?";
  const params = [value, gameUserId];

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

/* Assigns a chancellor */
const assignChancellor = (gameUserId, value) => {
  const query = "UPDATE game_user SET chancellor = ? WHERE game_user_id = ?";
  const params = [value, gameUserId];

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

/* Assigns prev chancellor */
const assignPrevChancellor = (gameUserId, value) => {
  const query =
    "UPDATE game_user SET prev_chancellor = ? WHERE game_user_id = ?";
  const params = [value, gameUserId];

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

/* Assigns Discarded flag for a policy */
const discardPolicy = (gamePolicyId, value) => {
  const query = "UPDATE game_policy SET discarded = ? WHERE game_policy_id = ?";
  const params = [value, gamePolicyId];

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

/* Assigns Enacted flag for a policy */
const enactPolicy = (gamePolicyId, value) => {
  const query = "UPDATE game_policy SET enacted = ? WHERE game_policy_id = ?";
  const params = [value, gamePolicyId];

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
        io.to(userLobby.game_id).emit("get-game-users", {
          result,
        });
        socket.leave(userLobby.game_id);
        console.log(userLobby.username + " left Game " + userLobby.game_id);
        if (result.length === 0) {
          await deleteGame(userLobby.game_id);
        } else {
          io.to(userLobby.gameId).emit(
            "ready-to-start",
            readyToStart(result, timers.get(userLobby.game_id))
          );
        }
      }
    }
  });
  console.log("User " + connectedUsers.get(socket.id) + " disconnected.");
  connectedUsers.delete(socket.id);
  io.sockets.emit("users-connected", connectedUsers.size);
  console.log("Connected Users:", connectedUsers.size);
};

io.on("connection", (socket) => {
  socket.on("login", (data) => {
    let userId = data.user_id;
    /* First login, add them to the map */
    if (!contains(connectedUsers, userId)) {
      connectedUsers.set(socket.id, userId);
      io.to(socket.id).emit("login");
      io.sockets.emit("users-connected", connectedUsers.size);
      console.log("User " + userId + " connected.");
      console.log("Connected Users:", connectedUsers.size);
    } else {
      /* User is already logged in, prevent the login */
      io.to(socket.id).emit("logout", "User already logged in");
      console.log("User " + userId + " attempted to login twice!");
    }
  });

  socket.on("join-game", async (data) => {
    let username = data.username;
    let gameId = data.game_id;

    let result = await getGameUsers(gameId);
    if (result) {
      socket.join(gameId);
      console.log(username + " joined Game " + gameId);

      /* Send updated list of game users to lobby */
      io.to(gameId).emit("get-game-users", {
        result,
      });
      io.to(gameId).emit(
        "ready-to-start",
        readyToStart(result, timers.get(gameId))
      );
    }
  });

  socket.on("leave-game", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.gameUserId;
    let username = data.username;

    let isLobby = await checkGameLobbyStatus(gameId);
    if (!isLobby) return;

    let deleted = await deleteUserFromLobby(gameUserId);
    if (deleted) {
      /* Grab all users in game */
      let result = await getGameUsers(gameId);
      if (result) {
        /* Send updated list of game users to lobby */
        io.to(gameId).emit("get-game-users", {
          result,
        });
        socket.leave(gameId);
        console.log(username + " left Game " + gameId);
        if (result.length === 0) {
          await deleteGame(gameId);
        } else {
          io.to(gameId).emit(
            "ready-to-start",
            readyToStart(result, timers.get(gameId))
          );
        }
      }
    }
  });

  /* Kicks a user from a lobby */
  socket.on("kick-user", async (data) => {
    let gameUserId = data.gameUserId;
    let gameId = data.gameId;
    let userId = data.userId;
    let username = data.username;

    let deleted = await deleteUserFromLobby(gameUserId);
    if (deleted) {
      let targetSocketId = getKey(connectedUsers, userId);
      io.to(targetSocketId).emit(
        "kicked",
        "You have been kicked from game " + gameId + "!"
      );

      io.sockets.sockets.get(targetSocketId).leave(gameId);
      console.log(username + " was kicked from Game " + gameId);

      /* Grab all users in game */
      let result = await getGameUsers(gameId);
      if (result) {
        /* Send updated list of game users to lobby */
        io.to(gameId).emit("get-game-users", {
          result,
        });
        if (result.length === 0) {
          await deleteGame(gameId);
        } else {
          io.to(gameId).emit(
            "ready-to-start",
            readyToStart(result, timers.get(gameId))
          );
        }
      }
    }
  });

  /* Toggle game user's ready status and sends updated player list */
  socket.on("user-ready", async (data) => {
    let gameUserId = data.gameUserId;
    let gameId = data.gameId;
    let username = data.username;
    let ready = data.ready;

    let readied = await readyGameUser(gameUserId, ready);
    if (readied) {
      console.log(
        username +
          " is " +
          (ready ? "ready" : "not ready") +
          " in Game " +
          gameId
      );

      /* Grab all users in game */
      let result = await getGameUsers(gameId);
      if (result) {
        /* Send updated list of game users to lobby */
        io.to(gameId).emit("get-game-users", {
          result,
        });
        io.to(gameId).emit(
          "ready-to-start",
          readyToStart(result, timers.get(gameId))
        );
      }
    }
  });

  socket.on("initialize-start-game", async (data) => {
    let gameId = data.gameId;
    let time = 10;
    /* If button pressed more than once, delete other interval */
    clearInterval(timers.get(gameId));
    /* With the set interval in the hashmap, there is a 2 second delay, so we must delay the first number by 1 second */
    setTimeout(() => io.to(gameId).emit("game-timer", time), 1000);
    timers.set(
      gameId,
      setInterval(async () => {
        /* Clear to reveal roles */
        if (time < 0) {
          console.log("Game " + gameId + " is starting");
          clearInterval(timers.get(gameId));
          timers.delete(gameId);

          let startedGame = await setStartTime(gameId);
          if (!startedGame) return;

          let gameUsers = await getGameUsers(gameId);
          if (!gameUsers) return;

          /* Create array of roles and randomize their values */
          let roles = [];
          for (let i = 1; i <= gameUsers.length; i++) {
            roles.push(i);
          }
          randomizeArray(roles);
          for (let i = 0; i < gameUsers.length; i++) {
            await assignRole(gameUsers[i].game_user_id, roles[i]);
          }
          /* Assign a random user as president */
          let randomUser = getRandomItem(gameUsers);
          await assignPresident(randomUser.game_user_id, 1);

          /* Grab all users in game */
          let result = await getGameUsers(gameId);
          if (result) {
            /* Send updated list of game users to lobby */
            io.to(gameId).emit("get-game-users", {
              result,
            });
            /* Push users to reveal role page */
            io.to(gameId).emit("reveal-role");
            time = 20;
            /* With the set interval in the hashmap, there is a 2 second delay, so we must delay the first number by 1 second */
            setTimeout(() => io.to(gameId).emit("game-timer", time), 1000);
            timers.set(
              gameId,
              setInterval(async () => {
                /* Clear to start game */
                if (time < 0) {
                  console.log("Game " + gameId + " has started");

                  clearInterval(timers.get(gameId));

                  /* Create array of policies and randomize their values */
                  let policies = [];
                  for (let i = 1; i <= 17; i++) {
                    policies.push(i);
                  }
                  randomizeArray(policies);
                  for (let i = 0; i < policies.length; i++) {
                    await createGamePolicies(gameId, i + 1, policies[i], 0, 0);
                  }

                  /* Grab all policies in game */
                  let gamePolicies = await getGamePolicies(gameId);
                  if (gamePolicies) {
                    /* Send game policies to lobby */
                    io.to(gameId).emit("get-game-policies", {
                      gamePolicies,
                    });
                    /* Push users to game page */
                    io.to(gameId).emit("start-game");
                    /* Let the president choose a chancellor */
                    io.to(gameId).emit("choose-chancellor");
                  }
                } else {
                  io.to(gameId).emit("game-timer", time--);
                }
              }, 1000)
            );
          }
        } else {
          io.to(gameId).emit("game-timer", time--);
        }
      }, 1000)
    );
  });

  socket.on("assign-chancellor", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.game_user_id;
    let value = data.value;

    await assignChancellor(gameUserId, value);

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (result) {
      /* Send updated list of game users to lobby */
      io.to(gameId).emit("get-game-users", {
        result,
      });
      io.to(gameId).emit("initiate-ballot");
    }
  });

  socket.on("cast-ballot", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.game_user_id;
    let username = data.username;
    let ballot = data.ballot;

    await castBallot(gameUserId, ballot);
    console.log(username + " voted " + (ballot === 1 ? "Ja!" : "Nein!"));

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (result) {
      let castedBallots = result.filter((gameUser) => gameUser.ballot !== null);
      /* If all players have voted */
      if (castedBallots.length === result.length) {
        let jas = castedBallots.filter(
          (gameUser) => gameUser.ballot === 1
        ).length;
        let neins = castedBallots.filter(
          (gameUser) => gameUser.ballot === 0
        ).length;
        /* Unassign ballot status */
        for (let i = 0; i < result.length; i++) {
          await castBallot(result[i].game_user_id, null);
        }
        if (jas > neins) {
          console.log("Ballot Passed in game " + gameId);
          io.to(gameId).emit("ballot-passed", { jas, neins });
          //TODO Assign prev president and prev chancellor, reset fail count
        } else {
          console.log("Ballot Failed in game " + gameId);
          io.to(gameId).emit("ballot-failed", { jas, neins });
          //TODO Unassign president and chancellor and assign new president and increase fail count. If 3, unassign prev president and prev chancellor
        }
      }
    }
  });

  socket.on("discard-policy", async (data) => {
    let gameId = data.gameId;
    let gamePolicyId = data.game_policy_id;
    let value = data.value;

    await discardPolicy(gamePolicyId, value);

    /* Grab all policies in game */
    let gamePolicies = await getGamePolicies(gameId);
    if (gamePolicies) {
      /* Send game policies to lobby */
      io.to(gameId).emit("get-game-policies", {
        gamePolicies,
      });
      io.to(gameId).emit("chancellor-policies");
    }
  });

  socket.on("enact-policy", async (data) => {
    let gameId = data.gameId;
    let gamePolicyId = data.game_policy_id;
    let value = data.value;

    await enactPolicy(gamePolicyId, value);

    /* Grab all policies in game */
    let gamePolicies = await getGamePolicies(gameId);
    if (gamePolicies) {
      /* Send game policies to lobby */
      io.to(gameId).emit("get-game-policies", {
        gamePolicies,
      });
      //TODO discard the other policy
      //TODO unassign president and chancellor, move presidency to next user
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
