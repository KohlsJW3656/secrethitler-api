const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

var allowedOrigins = [
  "https://secrethitleronline.duckdns.org",
  "https://secrethitleronline-d.duckdns.org",
  "https://www.secrethitleronline.duckdns.org",
  "https://www.secrethitleronline-d.duckdns.org",
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
    origin: [
      "http://localhost:3000",
      "https://secrethitleronline.duckdns.org",
      "https://secrethitleronline-d.duckdns.org",
    ],
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
}; /* randomizeArray */

const getRandomItem = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  const item = array[randomIndex];
  return item;
}; /* getRandomItem */

const getNextItem = (array, currentItem) => {
  let currentIndex = array.indexOf(currentItem);
  const nextIndex = ++currentIndex % array.length;
  const item = array[nextIndex];
  return item;
}; /* getNextItem */

/* Gets a key by a value */
const getKey = (map, value) => [...map].find(([key, val]) => val == value)[0];

const contains = (map, value) => {
  for (let val of map.values()) {
    if (val === value) {
      return true;
    }
  }
  return false;
}; /* getKey */

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
}; /* getUserLobbies */

const getGameUsers = (gameId) => {
  const query =
    "SELECT game_user.*, role.secret_identity, role.party_membership FROM game_user JOIN role ON game_user.role_id = role.role_id WHERE game_id = ? AND assassinated = FALSE";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result);
    });
  });
}; /* getGameUsers */

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
}; /* getGamePolicies */

const getSecretHitlerGame = (gameId) => {
  const query = "SELECT * FROM secret_hitler_game WHERE game_id = ?";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result[0]);
    });
  });
}; /* getSecretHitlerGame */

const createSecretHitlerGame = (gameId) => {
  const query = "INSERT INTO secret_hitler_game (game_id) VALUES (?)";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result);
    });
  });
}; /* createSecretHitlerGame */

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
}; /* createGamePolicies */

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
}; /* deleteGame */

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
}; /* checkGameLobbyStatus */

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
}; /* readyGameUser */

/* validates if a game is ready to start and clears the interval if the timer is already going */
const readyToStart = (gameUsers, interval) => {
  let allReady = gameUsers.filter((gameUser) => !gameUser.ready).length === 0;
  if (gameUsers.length < 5 || !allReady) {
    clearInterval(interval);
  }
  return allReady && gameUsers.length >= 5;
}; /* readyToStart */

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
}; /* setStartTime */

/* Assigns the end time for a game */
const setEndTime = (gameId) => {
  const query = "UPDATE game SET end_time = NOW() WHERE game_id = ?";
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
}; /* setEndTime */

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
}; /* assignRole */

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
}; /* castBallot */

/* Assigns a president */
const assignPresident = (gameUserId, value) => {
  const query = "UPDATE game_user SET president = ? WHERE game_user_id = ?";
  const params = [value, gameUserId];

  console.log(
    "Assign President gameUserId: " + gameUserId + " value: " + value
  );

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
}; /* assignPresident */

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
}; /* assignPrevPresident */

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
}; /* assignChancellor */

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
}; /* assignPrevChancellor */

/* Executes a player */
const executePlayer = (gameUserId, value) => {
  const query = "UPDATE game_user SET assassinated = ? WHERE game_user_id = ?";
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
}; /* executePlayer */

const assignConfirmedNotHitler = (gameUserId, value) => {
  const query =
    "UPDATE game_user SET confirmed_not_hitler = ? WHERE game_user_id = ?";
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
}; /* assignConfirmedNotHitler */

/* Sets the election tracker */
const assignElectionTracker = (gameId, value) => {
  const query =
    "UPDATE secret_hitler_game SET ballot_fail_count = ? WHERE game_id = ?";
  const params = [value, gameId];

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
}; /* assignElectionTracker */

/* Assigns the game turn */
const assignTurn = (gameId, value) => {
  const query = "UPDATE secret_hitler_game SET turn = ? WHERE game_id = ?";
  const params = [value, gameId];

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
}; /* assignTurn */

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
}; /* discardPolicy */

/* Assigns deck order for a policy */
const updateDeckOrder = (gamePolicyId, value) => {
  const query =
    "UPDATE game_policy SET deck_order = ? WHERE game_policy_id = ?";
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
}; /* updateDeckOrder */

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
}; /* enactPolicy */

const getFascistPolicyKey = (enactedFascistCount, minPlayers, maxPlayers) => {
  const query =
    "SELECT * FROM fascist_policy_key WHERE enacted_count = ? && min_players <= ? && max_players >= ?";
  const params = [enactedFascistCount, minPlayers, maxPlayers];

  return new Promise((resolve, reject) => {
    connection.query(query, params, (error, result) => {
      if (error) {
        return reject();
      }
      return resolve(result[0]);
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
}; /* deleteUserFromLobby */

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
}; /* disconnect */

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
  }); /* login */

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
  }); /* join-game */

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
  }); /* leave-game */

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
  }); /* kick-user */

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
  }); /* user-ready */

  socket.on("initialize-start-game", async (data) => {
    let gameId = data.gameId;
    let time = 5;
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
            time = 5;
            /* With the set interval in the hashmap, there is a 2 second delay, so we must delay the first number by 1 second */
            setTimeout(() => io.to(gameId).emit("game-timer", time), 1000);
            timers.set(
              gameId,
              setInterval(async () => {
                /* Clear to start game */
                if (time < 0) {
                  console.log("Game " + gameId + " has started");

                  clearInterval(timers.get(gameId));

                  /* Create ballot and turn counters */
                  await createSecretHitlerGame(gameId);

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
                    io.to(getKey(connectedUsers, randomUser.user_id)).emit(
                      "choose-chancellor"
                    );
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
  }); /* initialize-start-game */

  socket.on("assign-chancellor", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.game_user_id;
    let value = data.value;

    await assignChancellor(gameUserId, value);

    /* Send updated list of game users to lobby */
    let result = await getGameUsers(gameId);
    if (result) {
      io.to(gameId).emit("get-game-users", {
        result,
      });
      io.to(gameId).emit("initiate-ballot");
    }
  }); /* assign-chancellor */

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
        let currentPresident = result.filter(
          (gameUser) => gameUser.president === 1
        )[0];
        let currentChancellor = result.filter(
          (gameUser) => gameUser.chancellor === 1
        )[0];
        let prevPresident = result.filter(
          (gameUser) => gameUser.prev_president === 1
        )[0];
        let prevChancellor = result.filter(
          (gameUser) => gameUser.prev_chancellor === 1
        )[0];
        /* Unassign ballot status */
        for (let i = 0; i < result.length; i++) {
          await castBallot(result[i].game_user_id, null);
        }
        /* Passed Ballot */
        if (jas > neins) {
          console.log("Ballot Passed in game " + gameId);
          /* Unassign last pres and chancellor */
          if (prevPresident)
            await assignPrevPresident(prevPresident.game_user_id, 0);
          if (prevChancellor)
            await assignPrevChancellor(prevChancellor.game_user_id, 0);

          /* Assign Prev President and Prev chancellor to new ones */
          if (currentPresident)
            await assignPrevPresident(currentPresident.game_user_id, 1);
          if (currentChancellor)
            await assignPrevChancellor(currentChancellor.game_user_id, 1);

          /* Check for win condition of Hitler elected chancellor after 3 fascist policies */
          let gamePolicies = await getGamePolicies(gameId);
          if (gamePolicies) {
            let enactedFascist = gamePolicies.filter(
              (policy) => policy.enacted === 1 && policy.fascist === 1
            );
            if (enactedFascist.length >= 3) {
              if (currentChancellor.role_id === 1) {
                io.to(gameId).emit("game-win", {
                  message:
                    "Hitler was elected Chancellor after 3 fascist policies were enacted!",
                });
                await setEndTime(gameId);
                console.log(
                  "Fascists win by electing Hitler Chancellor in game " +
                    gameId +
                    "!"
                );
                return;
              } else if (currentChancellor.confirmed_not_hitler !== 1) {
                await assignConfirmedNotHitler(
                  currentChancellor.game_user_id,
                  1
                );
              }
            }
          }

          result = await getGameUsers(gameId);
          if (result) {
            /* Send updated list of game users to lobby */
            io.to(gameId).emit("get-game-users", {
              result,
            });
            io.to(gameId).emit("ballot-passed", { jas, neins });
            io.to(getKey(connectedUsers, currentPresident.user_id)).emit(
              "president-policies"
            );
          }
        } else {
          /* Failed Ballot */
          console.log("Ballot Failed in game " + gameId);
          let secretHitlerGame = await getSecretHitlerGame(gameId);
          if (!secretHitlerGame) return;

          /* Vote has failed 3 times */
          if (secretHitlerGame.ballot_fail_count === 2) {
            /* Reset eligibility */
            if (prevPresident)
              await assignPrevPresident(prevPresident.game_user_id, 0);
            if (prevChancellor)
              await assignPrevChancellor(prevChancellor.game_user_id, 0);

            /* Enact top policy */
            let gamePolicies = await getGamePolicies(gameId);
            if (!gamePolicies) return;
            let lastEnactedPolicy = gamePolicies.filter(
              (policy) =>
                policy.deck_order === 1 &&
                policy.discarded === 0 &&
                policy.enacted === 0
            )[0];
            await enactPolicy(lastEnactedPolicy.game_policy_id, 1);

            /* Reset election tracker */
            await assignElectionTracker(gameId, 0);

            /* Get updated policies and check to see if we need to reshuffle or fix the deck order */
            gamePolicies = await getGamePolicies(gameId);
            if (!gamePolicies) return;
            let deckPolicies = gamePolicies.filter(
              (policy) => policy.discarded === 0 && policy.enacted === 0
            );
            if (deckPolicies.length < 3) {
              let discardedPolicies = gamePolicies.filter(
                (policy) => policy.discarded === 1 && policy.enacted === 0
              );
              /* Unset all discarded policies */
              await Promise.all(
                discardedPolicies.map(async (policy) =>
                  discardPolicy(policy.game_policy_id, 0)
                )
              );
              /* Shuffle the policies and update the deck order */
              randomizeArray(discardedPolicies);
              await Promise.all(
                discardedPolicies.map(async (gamePolicy, index) =>
                  updateDeckOrder(gamePolicy.game_policy_id, index + 1)
                )
              );
            } else {
              /* Reset the deck order */
              await Promise.all(
                deckPolicies.map(async (gamePolicy, index) =>
                  updateDeckOrder(gamePolicy.game_policy_id, index + 1)
                )
              );
            }

            /* Get updated policies and send game policies to lobby */
            gamePolicies = await getGamePolicies(gameId);
            if (!gamePolicies) return;
            let enactedFascist = gamePolicies.filter(
              (policy) => policy.enacted === 1 && policy.fascist === 1
            );
            let enactedLiberal = gamePolicies.filter(
              (policy) => policy.enacted === 1 && policy.fascist === 0
            );
            io.to(gameId).emit("get-game-policies", {
              gamePolicies,
            });
            /* Check for win condition of policy length */
            if (enactedFascist.length === 6) {
              io.to(gameId).emit("game-win", {
                message: "Fascists have enacted 6 fascist policies!",
              });
              console.log(
                "Fascists win by enacted 5 liberal policies in game " +
                  gameId +
                  "!"
              );
              return;
            }
            if (enactedLiberal.length === 5) {
              io.to(gameId).emit("game-win", {
                message: "Liberals have enacted 5 liberal policies!",
              });
              console.log(
                "Liberals win by enacted 5 liberal policies! in game " +
                  gameId +
                  "!"
              );
              return;
            }
            // TODO: Check for game rule 'Political Leverage'
            /* If the game didn't end by policy count, check for fascist policy enacted and do presidential powers */
            if (lastEnactedPolicy.fascist && false) {
              let presidentialPower = await getFascistPolicyKey(
                enactedFascist.length,
                result.length,
                result.length
              );
              if (!presidentialPower) return;
              if (presidentialPower.name !== null) {
                console.log(
                  "Presidential Power " +
                    presidentialPower.name +
                    " was issued in game " +
                    gameId
                );
                io.to(getKey(connectedUsers, lastPresident.user_id)).emit(
                  presidentialPower.name,
                  { presidentialPower }
                );
                return;
              }
            }
          } else {
            /* Increase election tracker by 1 */
            await assignElectionTracker(
              gameId,
              secretHitlerGame.ballot_fail_count + 1
            );
          }

          /* Unassign President and chancellor */
          await assignPresident(currentPresident.game_user_id, 0);
          await assignChancellor(currentChancellor.game_user_id, 0);

          /* Assign the next president */
          let nextPresident = getNextItem(result, currentPresident);
          await assignPresident(nextPresident.game_user_id, 1);

          result = await getGameUsers(gameId);
          if (result) {
            /* Send updated list of game users to lobby */
            io.to(gameId).emit("get-game-users", {
              result,
            });
            io.to(gameId).emit("ballot-failed", { jas, neins });
            /* Let the president choose a chancellor */
            io.to(getKey(connectedUsers, nextPresident.user_id)).emit(
              "choose-chancellor"
            );
          }
        }
      }
    }
  }); /* cast-ballot */

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
    }
    let result = await getGameUsers(gameId);
    if (result) {
      let currentChancellor = result.filter(
        (gameUser) => gameUser.chancellor === 1
      )[0];
      io.to(getKey(connectedUsers, currentChancellor.user_id)).emit(
        "chancellor-policies"
      );
    }
  }); /* discard-policy */

  socket.on("enact-policy", async (data) => {
    let gameId = data.gameId;
    let gamePolicyId = data.game_policy_id;
    let value = data.value;

    /* Enact selected policy */
    await enactPolicy(gamePolicyId, value);

    /* Reset election tracker */
    await assignElectionTracker(gameId, 0);

    /* Grab all policies and discard the policy that was not selected */
    let gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    await discardPolicy(
      gamePolicies.filter(
        (policy) =>
          policy.deck_order <= 3 &&
          policy.discarded === 0 &&
          policy.enacted === 0
      )[0].game_policy_id,
      value
    );

    /* Get updated policies and check to see if we need to reshuffle or fix the deck order */
    gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    let deckPolicies = gamePolicies.filter(
      (policy) => policy.discarded === 0 && policy.enacted === 0
    );
    if (deckPolicies.length < 3) {
      let discardedPolicies = gamePolicies.filter(
        (policy) => policy.discarded === 1 && policy.enacted === 0
      );
      /* Unset all discarded policies */
      await Promise.all(
        discardedPolicies.map(async (policy) =>
          discardPolicy(policy.game_policy_id, 0)
        )
      );
      /* Shuffle the policies and update the deck order */
      randomizeArray(discardedPolicies);
      await Promise.all(
        discardedPolicies.map(async (gamePolicy, index) =>
          updateDeckOrder(gamePolicy.game_policy_id, index + 1)
        )
      );
    } else {
      /* Reset the deck order */
      await Promise.all(
        deckPolicies.map(async (gamePolicy, index) =>
          updateDeckOrder(gamePolicy.game_policy_id, index + 1)
        )
      );
    }

    /* Get updated policies and send game policies to lobby */
    gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    let enactedFascist = gamePolicies.filter(
      (policy) => policy.enacted === 1 && policy.fascist === 1
    );
    let enactedLiberal = gamePolicies.filter(
      (policy) => policy.enacted === 1 && policy.fascist === 0
    );
    io.to(gameId).emit("get-game-policies", {
      gamePolicies,
    });
    /* Check for win condition of policy length */
    if (enactedFascist.length === 6) {
      io.to(gameId).emit("game-win", {
        message: "Fascists have enacted 6 fascist policies!",
      });
      console.log(
        "Fascists win by enacted 5 liberal policies in game " + gameId + "!"
      );
      return;
    }
    if (enactedLiberal.length === 5) {
      io.to(gameId).emit("game-win", {
        message: "Liberals have enacted 5 liberal policies!",
      });
      console.log(
        "Liberals win by enacted 5 liberal policies! in game " + gameId + "!"
      );
      return;
    }

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (!result) return;
    let lastPresident = result.filter(
      (gameUser) => gameUser.president === 1
    )[0];
    let lastChancellor = result.filter(
      (gameUser) => gameUser.chancellor === 1
    )[0];

    let lastEnactedPolicy = gamePolicies.filter(
      (policy) => policy.game_policy_id === gamePolicyId
    )[0];

    /* If the game didn't end by policy count, check for fascist policy enacted and do presidential powers */
    if (lastEnactedPolicy.fascist) {
      let presidentialPower = await getFascistPolicyKey(
        enactedFascist.length,
        result.length,
        result.length
      );
      if (!presidentialPower) return;
      if (presidentialPower.name !== null) {
        console.log(
          "Presidential Power " +
            presidentialPower.name +
            " was issued in game " +
            gameId
        );
        io.to(getKey(connectedUsers, lastPresident.user_id)).emit(
          presidentialPower.name,
          { presidentialPower }
        );
        return;
      }
    }

    /* If the president doesn't need to do any actions */
    /* Unassign President and chancellor */
    await assignPresident(lastPresident.game_user_id, 0);
    await assignChancellor(lastChancellor.game_user_id, 0);

    /* Assign next president */
    let nextPresident = getNextItem(result, lastPresident);
    await assignPresident(nextPresident.game_user_id, 1);

    /* Send updated list of game users to lobby */
    result = await getGameUsers(gameId);
    if (!result) return;
    io.to(gameId).emit("get-game-users", {
      result,
    });
    /* Let the president choose a chancellor */
    io.to(getKey(connectedUsers, nextPresident.user_id)).emit(
      "choose-chancellor"
    );
  }); /* enact-policy */

  socket.on("request-veto", async (data) => {
    let gameId = data.gameId;

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (!result) return;
    let president = result.filter((gameUser) => gameUser.president === 1)[0];

    io.to(getKey(connectedUsers, president.user_id)).emit("requested-veto");
  });

  socket.on("veto-response", async (data) => {
    let gameId = data.gameId;
    let veto = data.veto;

    /* The president has refused to veto */
    if (!veto) {
      /* Grab all users in game */
      let result = await getGameUsers(gameId);
      if (!result) return;
      let chancellor = result.filter(
        (gameUser) => gameUser.chancellor === 1
      )[0];

      io.to(getKey(connectedUsers, chancellor.user_id)).emit(
        "chancellor-policies",
        { declinedVeto: true }
      );
      return;
    }
    /* The president has consented to veto */

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (!result) return;
    let currentPresident = result.filter(
      (gameUser) => gameUser.president === 1
    )[0];
    let currentChancellor = result.filter(
      (gameUser) => gameUser.chancellor === 1
    )[0];
    let prevPresident = result.filter(
      (gameUser) => gameUser.prev_president === 1
    )[0];
    let prevChancellor = result.filter(
      (gameUser) => gameUser.prev_chancellor === 1
    )[0];

    /* Discard the remaining policies */
    let gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    let remainingPolicies = gamePolicies.filter(
      (policy) =>
        policy.deck_order <= 3 && policy.discarded === 0 && policy.enacted === 0
    );
    await Promise.all(
      remainingPolicies.map(async (policy) =>
        discardPolicy(policy.game_policy_id, 1)
      )
    );

    /* Get updated policies and check to see if we need to reshuffle or fix the deck order */
    gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    let deckPolicies = gamePolicies.filter(
      (policy) => policy.discarded === 0 && policy.enacted === 0
    );
    if (deckPolicies.length < 3) {
      let discardedPolicies = gamePolicies.filter(
        (policy) => policy.discarded === 1 && policy.enacted === 0
      );
      /* Unset all discarded policies */
      await Promise.all(
        discardedPolicies.map(async (policy) =>
          discardPolicy(policy.game_policy_id, 0)
        )
      );
      /* Shuffle the policies and update the deck order */
      randomizeArray(discardedPolicies);
      await Promise.all(
        discardedPolicies.map(async (gamePolicy, index) =>
          updateDeckOrder(gamePolicy.game_policy_id, index + 1)
        )
      );
    } else {
      /* Reset the deck order */
      await Promise.all(
        deckPolicies.map(async (gamePolicy, index) =>
          updateDeckOrder(gamePolicy.game_policy_id, index + 1)
        )
      );
    }

    /* Get updated policies and send game policies to lobby */
    gamePolicies = await getGamePolicies(gameId);
    if (!gamePolicies) return;
    io.to(gameId).emit("get-game-policies", {
      gamePolicies,
    });

    /* Check the election tracker */
    let secretHitlerGame = await getSecretHitlerGame(gameId);
    if (!secretHitlerGame) return;

    /* Vote has failed 3 times */
    if (secretHitlerGame.ballot_fail_count === 2) {
      /* Reset eligibility */
      if (prevPresident)
        await assignPrevPresident(prevPresident.game_user_id, 0);
      if (prevChancellor)
        await assignPrevChancellor(prevChancellor.game_user_id, 0);

      /* Enact top policy */
      gamePolicies = await getGamePolicies(gameId);
      if (!gamePolicies) return;
      await enactPolicy(
        gamePolicies.filter(
          (policy) =>
            policy.deck_order === 1 &&
            policy.discarded === 0 &&
            policy.enacted === 0
        )[0].game_policy_id,
        1
      );

      /* Reset election tracker */
      await assignElectionTracker(gameId, 0);

      /* Get updated policies and check to see if we need to reshuffle or fix the deck order */
      gamePolicies = await getGamePolicies(gameId);
      if (!gamePolicies) return;
      let deckPolicies = gamePolicies.filter(
        (policy) => policy.discarded === 0 && policy.enacted === 0
      );
      if (deckPolicies.length < 3) {
        let discardedPolicies = gamePolicies.filter(
          (policy) => policy.discarded === 1 && policy.enacted === 0
        );
        /* Unset all discarded policies */
        await Promise.all(
          discardedPolicies.map(async (policy) =>
            discardPolicy(policy.game_policy_id, 0)
          )
        );
        /* Shuffle the policies and update the deck order */
        randomizeArray(discardedPolicies);
        await Promise.all(
          discardedPolicies.map(async (gamePolicy, index) =>
            updateDeckOrder(gamePolicy.game_policy_id, index + 1)
          )
        );
      } else {
        /* Reset the deck order */
        await Promise.all(
          deckPolicies.map(async (gamePolicy, index) =>
            updateDeckOrder(gamePolicy.game_policy_id, index + 1)
          )
        );
      }

      /* Get updated policies and send game policies to lobby */
      gamePolicies = await getGamePolicies(gameId);
      if (!gamePolicies) return;
      let enactedFascist = gamePolicies.filter(
        (policy) => policy.enacted === 1 && policy.fascist === 1
      );
      let enactedLiberal = gamePolicies.filter(
        (policy) => policy.enacted === 1 && policy.fascist === 0
      );
      io.to(gameId).emit("get-game-policies", {
        gamePolicies,
      });
      /* Check for win condition of policy length */
      if (enactedFascist.length === 6) {
        io.to(gameId).emit("game-win", {
          message: "Fascists have enacted 6 fascist policies!",
        });
        console.log(
          "Fascists win by enacted 5 liberal policies in game " + gameId + "!"
        );
        return;
      }
      if (enactedLiberal.length === 5) {
        io.to(gameId).emit("game-win", {
          message: "Liberals have enacted 5 liberal policies!",
        });
        console.log(
          "Liberals win by enacted 5 liberal policies! in game " + gameId + "!"
        );
        return;
      }
    } else {
      /* Increase election tracker by 1 */
      await assignElectionTracker(
        gameId,
        secretHitlerGame.ballot_fail_count + 1
      );
    }

    /* Unassign President and chancellor */
    await assignPresident(currentPresident.game_user_id, 0);
    await assignChancellor(currentChancellor.game_user_id, 0);

    /* Assign the next president */
    let nextPresident = getNextItem(result, currentPresident);
    await assignPresident(nextPresident.game_user_id, 1);

    result = await getGameUsers(gameId);
    if (result) {
      /* Send updated list of game users to lobby */
      io.to(gameId).emit("get-game-users", {
        result,
      });
      /* Let the president choose a chancellor */
      io.to(getKey(connectedUsers, nextPresident.user_id)).emit(
        "choose-chancellor"
      );
    }
  });

  socket.on("presidential-power", async (data) => {
    let gameId = data.gameId;
    let gameUserId = data.game_user_id;
    let value = data.value;
    let execution = data.execution;
    let roleId = data.role_id;

    if (execution) {
      await executePlayer(gameUserId, value);
      if (roleId === 1) {
        io.to(gameId).emit("game-win", {
          message: "Hitler was executed!",
        });
        await setEndTime(gameId);
        console.log(
          "Liberals win by Hitler getting executed in game " + gameId + "!"
        );
        return;
      }
    }

    /* Grab all users in game */
    let result = await getGameUsers(gameId);
    if (!result) return;
    let lastPresident = result.filter(
      (gameUser) => gameUser.president === 1
    )[0];
    let lastChancellor = result.filter(
      (gameUser) => gameUser.chancellor === 1
    )[0];

    await assignPresident(lastPresident.game_user_id, 0);

    // Ensure the last chancellor wasn't executed
    if (lastChancellor) {
      await assignChancellor(lastChancellor.game_user_id, 0);
    }

    /* Assign next president */
    let nextPresident = getNextItem(result, lastPresident);
    await assignPresident(nextPresident.game_user_id, 1);

    /* Send updated list of game users to lobby */
    result = await getGameUsers(gameId);
    if (!result) return;
    io.to(gameId).emit("get-game-users", {
      result,
    });
    /* Let the president choose a chancellor */
    io.to(getKey(connectedUsers, nextPresident.user_id)).emit(
      "choose-chancellor"
    );
  });

  socket.on("logout", () => disconnect(socket));
  socket.on("disconnect", () => disconnect(socket));
});

const PORT = 3445;

server.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});

module.exports = server;
