const connection = require("../connection");

/*
  Route: /gameuser/join
  Joins a game
*/
exports.joinGame = async (req, res) => {
  const query =
    "INSERT INTO game_user(game_id, user_id, role_id, username) VALUES (?, ?, ?, ?)";
  const params = [req.body.game_id, req.user.user_id, 0, req.body.username];

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
