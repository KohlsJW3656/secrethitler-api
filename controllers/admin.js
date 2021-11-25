const connection = require("../connection");

/*
  Route: /admin/user/all
  Selects all users
*/
exports.allUsers = async (req, res) => {
  const query =
    "SELECT user_id, email, first_name, last_name, account_type, last_used FROM user";

  let isAdmin = req.user.account_type === 1;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      if (isAdmin) {
        res.send({
          ok: true,
          users: results,
        });
      } else {
        res.status(401).send("Needs Elevation!");
      }
    });
  });
};

/*
  Route: /admin/user/edit
  Edits all user information
*/
exports.editUser = async (req, res) => {
  const query =
    "UPDATE user SET first_name = ?, last_name = ?, email = ?, account_type = ? WHERE user_id = ?";
  const params = [
    req.body.first_name,
    req.body.last_name,
    req.body.email,
    req.body.account_type,
    req.body.user_id,
  ];

  let isAdmin = req.user.account_type === 1;

  //Updates User on user_id, withheld changing of password.
  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    if (isAdmin) {
      res.send({
        ok: true,
      });
    } else {
      res.status(401).send("Needs Elevation!");
    }
  });
};

/*
  Route: /admin/user/delete
  Deletes a user
*/
exports.deleteUser = async (req, res) => {
  const query = "DELETE FROM user WHERE user_id = ?";
  const params = [req.body.user_id];

  let isAdmin = req.user.account_type === 1;

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    if (isAdmin) {
      res.send({
        ok: true,
      });
    } else {
      res.status(401).send("Needs Elevation!");
    }
  });
};
