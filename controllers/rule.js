const connection = require("../connection");

/*
  Route: /rule/all
  Selects all rules
*/
exports.allRules = async (req, res) => {
  const query = "SELECT * FROM rule";

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      rules: results,
    });
  });
};
