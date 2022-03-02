const connection = require("../connection");
const bcrypt = require("bcrypt");

const checkIfGameExists = (gameId) => {
  //Generate query with prepared statement
  const query = "SELECT * FROM game WHERE game_id = ?";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }

      if (results.length == 0) {
        //No game exists with the game_id
        return resolve(false);
      } else {
        //A user exists with the game_id
        return resolve(true);
      }
    });
  });
};

const getPassword = (gameId) => {
  const query =
    "SELECT password FROM game WHERE game_id = ? && private_game = 1";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (results.length == 0) {
        //No game exists with the game_id
        return resolve(false);
      } else {
        //A game exists with the game_id
        return resolve(results[0].password);
      }
    });
  });
};

const getGameType = (gameId) => {
  const query = "SELECT private_game FROM game WHERE game_id = ?";
  const params = [gameId];

  return new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (results.length == 0) {
        return resolve(false);
      } else {
        return resolve(results[0].private_game === 1);
      }
    });
  });
};

/*
  Route: /gameuser/join
  Joins a game
*/
exports.joinGame = async (req, res) => {
  let gameId = req.body.game_id;
  let password = req.body.password;
  let passwordInDB = await getPassword(gameId);

  /* No game exists, return */
  if (!(await checkIfGameExists(gameId)))
    return res.status(400).send("No game found");

  /* If the game is private, check the game password */
  if (await getGameType(gameId)) {
    // No password provided
    if (!password) {
      return res.status(400).send("No password provided");
    }

    //Game doesn't exist in the database
    if (!passwordInDB) {
      return res.status(400).send("No game found");
    }

    //Check to see if the password is correct
    let correctPassword = await bcrypt.compare(password, passwordInDB);

    //Password is incorrect
    if (!correctPassword) {
      return res.status(401).send("Incorrect password");
    }
  }

  const query =
    "INSERT INTO game_user(game_id, user_id, role_id, username) VALUES (?, ?, ?, ?)";
  const params = [gameId, req.user.user_id, 0, req.body.username];

  //Connect to the database and run the query
  connection.query(query, params, (error, result) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      id: result.insertId,
    });
  });
};

/*
  Route: /gameuser/kick
  Deletes a user from a lobby
*/
exports.kickGameUser = async (req, res) => {
  const query = "DELETE FROM game_user WHERE game_user_id = ?";
  const params = [req.body.game_user_id];

  connection.query(query, params, (error, result) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
    });
  });
};
