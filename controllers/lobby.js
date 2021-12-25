const connection = require("../connection");

/*
  Route: /lobby/delete
  Deletes a lobby
*/
exports.deleteLobby = async (req, res) => {
  //Delete all users from lobby
  await new Promise((resolve, reject) => {
    const query2 = "DELETE FROM lobby_user WHERE lobby_id = ?";
    const params2 = [req.body.lobby_id];

    connection.query(query2, params2, (error, results) => {
      if (error) {
        return reject();
      } else {
        return resolve(results);
      }
    });
  });

  const query = "DELETE FROM lobby WHERE lobby_id = ?";
  const params = [req.body.lobby_id];

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
  Route: /lobby/create
  Creates a lobby
*/
exports.createLobby = async (req, res) => {
  const query =
    "INSERT INTO lobby(lobby_code, player_count, private_game, time_created) VALUES (?, ?, ?, NOW())";
  const params = [req.body.lobby_code, 1, req.body.private_game];

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
  Route: /lobby/all
  Selects all lobbies
*/
exports.allLobbies = async (req, res) => {
  const query = "SELECT * FROM lobby ORDER BY lobby_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      allLobbies: results,
    });
  });
};

/*
  Route: /lobby/all/public
  Selects all public lobbies
*/
exports.allPublic = async (req, res) => {
  const query =
    "SELECT * FROM lobby where private_game = 0 ORDER BY lobby_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      publicLobbies: results,
    });
  });
};

/*
  Route: /lobby/all/private
  Selects all private lobbies
*/
exports.allPrivate = async (req, res) => {
  const query =
    "SELECT * FROM lobby where private_game = 1 ORDER BY lobby_id ASC";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      privateLobbies: results,
    });
  });
};
