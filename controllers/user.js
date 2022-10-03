const jwt = require("jsonwebtoken");
const fs = require("fs");
const nodemailer = require("nodemailer");
const connection = require("../connection");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const secretJwt = JSON.parse(fs.readFileSync("jwt.json", "utf8")).jwt;

/*
  Route: /user/signup
  Create a user in the database
*/
exports.create = async (req, res) => {
  // Check to see if the user exists
  let userExists = await checkIfUserExists(req.body.email);

  if (!userExists) {
    //No user exists, so generate insert query
    const query =
      "INSERT INTO user(first_name, last_name, email, verified, account_type, last_used, password) VALUES (?, ?, ?, ?, ?, now(), ?)";

    //Hash the password
    let password = await bcrypt.hash(req.body.password, saltRounds);

    //Params for prepared SQL
    const params = [
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      0,
      0,
      password,
    ];

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
  } else {
    //A user exists so return an error
    res.status(400).send("User Exists");
  }
};

/*
  Route: /user/login
  Log a user in. On verification, it will send a a jwt to the client
*/
exports.login = async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let source = req.body.source;

  // No password or email provided
  if (!email || !password) {
    return res.status(401).send("No email or password provided");
  }

  //Get the password stored in the database
  let passwordInDB = await getPassword(email, password);

  //Email doesn't exist in the database
  if (!passwordInDB) {
    return res.status(401).send("No account with that email exists");
  }

  //Check to see if the password is correct
  let correctPassword = await bcrypt.compare(password, passwordInDB);

  //Password is incorrect
  if (!correctPassword) {
    return res.status(401).send("Incorrect password");
  }

  //Get the user id and account_type
  const query = "SELECT id, account_type FROM user WHERE email = ?";
  const params = [email];

  let userData = await new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (results.length == 0) {
        return reject();
      } else {
        return resolve(results[0]);
      }
    });
  });

  if (!userData.id) {
    return res.status(401).send("Couldn't get user id");
  }

  //Update the last_used date
  await new Promise((resolve, reject) => {
    const query2 = "UPDATE user SET last_used = now() where id = ?";
    const params2 = [userData.id];

    connection.query(query2, params2, (error, results) => {
      if (error) {
        return reject();
      } else {
        return resolve(results);
      }
    });
  });

  //generate jwt
  let jwt = generateJWT(
    {
      id: userData.id,
      email: email,
      account_type: userData.account_type,
    },
    source
  );

  //send the jwt
  res.json({ ok: true, jwt: jwt });
};

/*
  Route: /user
  Get user
*/
exports.get = async (req, res) => {
  const query =
    "SELECT id, email, first_name, last_name, account_type, last_used from user WHERE id = ?";
  const params = [req.user.id];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
      user: results,
    });
  });
};

/*
  Route: /user/edit
  Updates User on id, with changing of password.
*/
exports.edit = async (req, res) => {
  const query =
    "UPDATE user SET first_name = ?, last_name = ?, email = ?, password = ? WHERE id = ?";

  let password = await bcrypt.hash(req.body.password, saltRounds);

  const params = [
    req.body.first_name,
    req.body.last_name,
    req.body.email,
    password,
    req.user.id,
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

/*
  Route: /user/forgotpassword
  Sends an email to the user with a link to reset their password
*/
exports.forgotPassword = async (req, res) => {
  let email = req.body.email;
  let userExists = await checkIfUserExists(email);
  if (userExists) {
    //Get the user id and account_type
    const query = "SELECT id, account_type FROM user WHERE email = ?";
    const params = [email];

    let userData = await new Promise((resolve, reject) => {
      //Query the database with the query
      connection.query(query, params, (error, results) => {
        if (results.length == 0) {
          return reject();
        } else {
          return resolve(results[0]);
        }
      });
    });

    if (!userData.id) {
      return res.status(401).send("Couldn't get user id");
    }

    //generate jwt
    let jwt = generateJWT(
      {
        id: userData.id,
        email: email,
        account_type: userData.account_type,
      },
      "Reset"
    );

    let htmlFile = await new Promise((resolve, reject) => {
      fs.readFile(
        "./emails/resetpassword.html",
        { encoding: "utf-8" },
        (err, data) => {
          if (err) {
            return reject();
          } else {
            return resolve(data.replace("$jwt$", jwt));
          }
        }
      );
    });

    //Generate email file
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: JSON.parse(fs.readFileSync("emailCredentials.json", "utf8")),
    });
    let mailOptions = {
      from: JSON.parse(fs.readFileSync("emailCredentials.json", "utf8")).email,
      to: email,
      subject: "FMyA Password Reset",
      html: htmlFile,
    };

    //Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.send({
          ok: true,
        });
      }
    });
  } else {
    //A user doesn't exist so return an error
    res.status(400).send("User Doesn't Exist!");
  }
};

/*
  Route: /user/resetpassword
  Updates a user's password
*/
exports.resetPassword = async (req, res) => {
  const query = "UPDATE user SET password = ? WHERE id = ?";
  let password = await bcrypt.hash(req.body.password, saltRounds);

  const params = [password, req.user.id];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
    }
    res.send({
      ok: true,
    });
  });
};

/**
 * Util function to check if the user exists
 * @param {} email the email submitted in the body of the request
 * @returns A promise resolving to false if the user does not exist
 * and true if the user does exist
 */
function checkIfUserExists(email) {
  //Generate query with prepared statement
  const query = "SELECT * FROM user WHERE email = ?";
  const params = [email];

  return new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }

      if (results.length == 0) {
        //No user exists with the email
        return resolve(false);
      } else {
        //A user exists with the email
        return resolve(true);
      }
    });
  });
}

function getPassword(email, password) {
  const query = "SELECT password FROM user WHERE email = ?";
  const params = [email];

  return new Promise((resolve, reject) => {
    //Query the database with the query
    connection.query(query, params, (error, results) => {
      if (results.length == 0) {
        //No user exists with the email
        return resolve(false);
      } else {
        //A user exists with the email
        return resolve(results[0].password);
      }
    });
  });
}

function generateJWT(user, source) {
  if (source === "Reset") {
    return jwt.sign(user, secretJwt, { expiresIn: "1d" });
  } else {
    return jwt.sign(user, secretJwt, { expiresIn: "7d" });
  }
}
