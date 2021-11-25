const connection = require("../connection");

/*
  Route: /policy/all
  Selects all policies
*/
exports.allPolicies = async (req, res) => {
  const query = "SELECT * FROM policy ORDER BY deckOrder ASC";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        allPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/draw
  Selects top 3 or 2 policies depending on the turn
*/
exports.drawPolicies = async (req, res) => {
  const query =
    "SELECT * FROM policy WHERE deckOrder < 3 AND isDiscarded = 0 AND isEnacted = 0 ORDER BY deckOrder ASC";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        drawPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/deck
  Selects all policies that are in the deck
*/
exports.deckPolicies = async (req, res) => {
  const query =
    "SELECT * FROM policy WHERE isDiscarded = 0 AND isEnacted = 0 ORDER BY deckOrder ASC";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        deckPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/discarded
  Selects all policies that are discarded
*/
exports.discardedPolicies = async (req, res) => {
  const query =
    "SELECT * FROM policy WHERE isDiscarded = 1 AND isEnacted = 0 ORDER BY deckOrder ASC";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        discardedPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/enacted
  Selects all policies that are enacted
*/
exports.enactedPolicies = async (req, res) => {
  const query = "SELECT * FROM policy WHERE isEnacted = 1";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        enactedPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/notenacted
  Selects all policies that are not enacted
*/
exports.notEnactedPolicies = async (req, res) => {
  const query = "SELECT * FROM policy WHERE isEnacted = 0";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        notEnactedPolicies: results,
      });
    });
  });
};

/*
  Route: /policy/top
  Selects the top policy
*/
exports.topPolicy = async (req, res) => {
  const query =
    "SELECT * FROM policy WHERE deckOrder = 0 AND isDiscarded = 0 AND isEnacted = 0";

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
      res.send({
        ok: true,
        topPolicy: results[0],
      });
    });
  });
};

/*
  Route: /policy/edit
  Edits policy information
*/
exports.editPolicy = async (req, res) => {
  const query =
    "UPDATE policy SET type = ?, deckOrder = ?, isDiscarded = ?, isEnacted = ? WHERE policy_id = ?";
  const params = [
    req.body.type,
    req.body.deckOrder,
    req.body.isDiscarded,
    req.body.isEnacted,
    req.body.policy_id,
  ];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
    });
  });
};
