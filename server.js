const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

require("dotenv").config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// homepage route
app.get("/", (req, res) => {
  return res.send({
    error: false,
    message: "Not thing",
  });
});

// connect to mysql database
let dbCon = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.DATABASE,
  port: process.env.PORT_DB,
});
dbCon.connect();

app.get("/api/check_update", (req, res) => {
  dbCon.query(
    "SELECT table_status.* FROM table_status",
    (error, results, fields) => {
      if (error) {
        throw error;
      }
      let message = "";
      if (results === undefined || results.length === 0) {
        message = "table is empty";
        return res.send({
          result: message,
        });
      } else if (results) {
        return res.send({
          result: results,
        });
      } else {
        message = "Not found!";
        return res.send({
          result: message,
          message: "error",
        });
      }
    }
  );
});

app.post("/api/login", (req, res) => {
  const secretkey = process.env.SECRETKEY;
  const pass_hash = process.env.PASSWORD_HASH;
  const username = process.env.USERNAME;

  // เอาวันหมดอายุแนบไปด้วย เวลาจะต้องสัมพันธ์กับ expiresIn
  const exp_date = Math.round(Date.now() / 1000 + 60 * 10);

  // เพิ่มมาใหม่
  try {
    if (
      req.body.username === username &&
      req.body.password_hash === pass_hash
    ) {
      let today = new Date();
      let start =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      const user = {
        email: req.body.email,
        provider: "CMPHO",
        date_request: start,
        exp_date: exp_date,
      };

      jwt.sign({ user }, secretkey, { expiresIn: "600s" }, (err, token) => {
        res.json({
          token,
        });
      });
    } else {
      res.status(401).json({
        message: "login failed.",
      });
    }
  } catch (e) {
    console.log(e);
  }
});

// Verify Token
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    // Set the token
    req.token = bearer[1];
    // Next middleware
    next();
  } else {
    // Forbidden
    // res.sendStatus(403);
  }
}

app.post("/api/:tables", verifyToken, (req, res) => {
  const secretkey = process.env.SECRETKEY;

  jwt.verify(req.token, res, secretkey, (error, decoded) => {
    // const exp = authData.user['exp_date'];
    const dateNow = Math.round(Date.now() / 1000);

    if (error) {
      res.status(403).json({ message: error, status: 403 });
      // throw err;
    } else {
      let tables = req.params.tables;

      if (!tables) {
        return res.status(400).send({ error: true, message: "Not Found!" });
      } else {
        dbCon.query("SELECT * FROM ??", tables, (error, results, fields) => {
          if (error) {
            res.json({
              message: [
                {
                  code: error.code,
                  errno: error.errno,
                },
              ],
            });
            // throw error;
          } else {
            let message = "OK";
            return res.json({
              dateNow,
              message,
              error: false,
              data: results,
              decoded,
            });
          }
        });
      }
    }
  });
});

let port = process.env.PORT;
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
