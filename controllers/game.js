const connection = require("../connection");
const bcrypt = require("bcrypt");
const saltRounds = 10;

/*
  Route: /game/delete
  Deletes a game
*/
exports.deleteGame = async (req, res) => {
  //Delete all users from game
  await new Promise((resolve, reject) => {
    const query2 = "DELETE FROM game_user WHERE game_id = ?";
    const params2 = [req.body.game_id];

    connection.query(query2, params2, (error, results) => {
      if (error) {
        return reject();
      } else {
        return resolve(results);
      }
    });
  });

  const query = "DELETE FROM game WHERE game_id = ?";
  const params = [req.body.game_id];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
    });
  });
};

/*
  Route: /game/create
  Creates a game
*/
exports.createGame = async (req, res) => {
  let password;
  const query =
    "INSERT INTO game(name, private_game, created_time, password) VALUES (?, ?, NOW(), ?)";

  if (req.body.password) {
    password = await bcrypt.hash(req.body.password, saltRounds);
  }
  const params = [req.body.name, req.body.private_game, password];

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
  Route: /game/all
  Selects all games
*/
exports.allGames = async (req, res) => {
  const query = "SELECT * FROM game ORDER BY game_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      allGames: results,
    });
  });
};

/*
  Route: /game/all/joinable
  Selects all games that are not in progress
*/
exports.allJoinable = async (req, res) => {
  const query =
    "SELECT game.*, COUNT(game_user.game_id) FROM game JOIN game_user ON game.game_id = game_user.game_id WHERE game.start_time IS NULL GROUP BY game_user.game_id ORDER BY COUNT(game_user.game_id) DESC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      joinableGames: results,
    });
  });
};

/*
  Route: /game/all/public
  Selects all public games
*/
exports.allPublic = async (req, res) => {
  const query =
    "SELECT * FROM game where private_game = 0 ORDER BY game_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      publicGames: results,
    });
  });
};

/*
  Route: /game/all/private
  Selects all private games
*/
exports.allPrivate = async (req, res) => {
  const query =
    "SELECT * FROM game where private_game = 1 ORDER BY game_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      privateGames: results,
    });
  });
};
