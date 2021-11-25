const jwt = require("jsonwebtoken");
const fs = require("fs");
const secretJwt = JSON.parse(fs.readFileSync("jwt.json", "utf8")).jwt;

/**
 * This is a middleware function that should be added on all protected routes
 * or routes that a user should be logged in to access. It will check the JWT token
 * that the client sends with their request. If it is valid the user's information,
 * user_id and email, will be put the request object and the next function will be called
 * called
 * @param {} req the request object
 * @param {*} res the res object
 * @param {*} next the next function call
 * @returns
 */
function authenticateToken(req, res, next) {
  // Grab the JWT token
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  // Verify the JWT token
  jwt.verify(token, secretJwt, (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }

    //user_id, email, accout_type, service will be put onto the req.user object
    req.user = user;

    //continue to the next function
    next();
  });
}

module.exports = authenticateToken;
