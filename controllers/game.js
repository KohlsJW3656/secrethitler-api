const connection = require("../connection");

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
  const query =
    "INSERT INTO game(game_code, private_game, created_time) VALUES (?, ?, NOW())";
  const params = [req.body.game_code, req.body.private_game];

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
