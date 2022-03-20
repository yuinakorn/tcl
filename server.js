const express = require('express');
const app = express();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

app.use(express.json());

// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            version: "1.0.0",
            title: "Cleft API",
            description: "/Chiang Mai Provincial Health Public Health Office ",
            contact: {
                name: "API"
            },
            servers: ["http://localhost:3000"]
        },
        authorizeBtn: null
    },
    // ['.routes/*.js']
    apis: ["server.js"]
};

var options = {
    customCss: '.swagger-ui .topbar { display: blog } .scheme-container { display: none } body { background-color: #FFF }'
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, options));

require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// homepage route
app.get('/', (req, res) => {
    return res.send({
        error: false,
        message: 'Not thing'
    })
});

// connect to mysql database
let dbCon = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});
dbCon.connect();

/**
 * @swagger
 * /api/check_update:
 *  get:
 *      tags: [check-update]
 *      summary: ตรวจสอบการอัพเดทข้อมูล
 *      responses:
 *          '200':
 *              description: A successful response
 */

// check update
app.get('/api/check_update', (req, res) => {
    dbCon.query('SELECT table_status.* FROM table_status', (error, results, fields) => {
        if (error) throw error;
        let message = "";
        if (results === undefined || results.length == 0) {
            message = "table is empty";
            return res.send({
                result: message
            });
        } else if (results) {
            return res.send({
                result: results,
            });
        } else {
            message = 'Not found!'
            return res.send({
                result: message,
                message: "error"
            });
        }
        // return res.send({
        //     error: false,
        //     data: results,
        //     message: message
        // });
    });
});


/**
 * @swagger
 * /api/login:
 *  post:
 *    tags: [data]
 *    summary: ยืนยันตัวตนเพื่อรับ token
 *    parameters:
 *      - in: path
 *        name: username
 *        schema:
 *          type: date
 *        required: true
 *        description:  username and password
 *    responses:
 *      '200':
 *        description: A successful response
 *
 */

// JWT
app.post('/api/login', (req, res) => {
    const secretkey = process.env.secretkey;
    const pass_hash = process.env.password_hash;
    const username = process.env.username;

    // เอาวันหมดอายุแนบไปด้วย เวลาจะต้องสัมพันธ์กับ expiresIn
    const exp_date = Math.round((Date.now() / 1000) + (60 * 15));

    // เพิ่มมาใหม่
    try {
        if (req.body.username === username && req.body.password_hash === pass_hash) {
            let today = new Date();
            let start = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            const user = {
                'email': req.body.email,
                'provider': 'CMPHO',
                'date_request': start,
                'exp_date': exp_date
            }

            jwt.sign({user}, secretkey, {expiresIn: '3600s'}, (err, token) => {
                res.json({
                    token
                });
            });
        } else {
            res.json({
                message: 'login failed.',
            });

        }
    } catch (e) {
        console.log(e);
    }

    ///////

});


// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }

}


// JWT verify Token

// app.post('/api/posts', verifyToken, (req, res) => {
//     jwt.verify(req.token, 'secretkey', (err, authData) => {
//         const exp = authData.exp;
//         const dateNow = Math.round(Date.now()/1000);
//         if(err) {
//             res.sendStatus(403);
//         } else {
//             res.json({
//                 message: 'OK',
//                 authData,
//                 exp,
//                 dateNow
//             });
//         }
//     });
// });


/**
 * @swagger
 * /api/:tables:
 *  post:
 *    tags: [data]
 *    summary: ใส่ชื่อตารางที่ต้องการ get พร้อมแนบ token มาด้วย
 *    parameters:
 *      - in: path
 *        name: d_update
 *        schema:
 *          type: date
 *        required: true
 *        description: max your d_update
 *    responses:
 *      '200':
 *        description: A successful response
 *
 */

app.post('/api/:tables', verifyToken, (req, res) => {

    const secretkey = process.env.secretkey;

    jwt.verify(req.token, secretkey, (err, decoded) => {
        // const exp = authData.user['exp_date'];
        const dateNow = Math.round(Date.now() / 1000);
        if (err) {
            res.sendStatus(403);
        } else {
            let tables = req.params.tables;
            if (!tables) {
                return res.status(400).send({error: true, message: 'Not Thing!'})
            } else {
                dbCon.query("SELECT * FROM ??", tables, (error, results, fields) => {
                    if (error) throw error;
                    let message = "";
                    if (results === undefined || results.length == 0) {
                        message = 'No data';
                    } else {
                        message = 'OK';
                    }
                    return res.json({
                        dateNow,
                        error: false,
                        data: results,
                        message,
                        decoded
                    })
                });
            }

            // res.json({
            //     message: 'OK',
            //     authData,
            //     exp,
            //     dateNow
            // });
        }
    });
});


// app.get('/api/:tablesss', (req,res) => {
//     let tables = req.params.tables;
//     if (!tables) {
//         return res.status(400).send({ error: true, message: 'Not Thing!' })
//     } else  {
//         dbCon.query("SELECT * FROM ?? LIMIT 10", tables, (error, results, fields) => {
//             if (error) throw error;
//             let message = "";
//             if (results === undefined || results.length == 0) {
//                 message = 'No data';
//             } else {
//                 message = 'OK';
//             }
//             return res.send({
//                 error: false,
//                 data: results,
//                 message: message
//             })
//         });
//     }
// });


let port = 3000;
app.listen(port, () => {
    console.log("NodeJS is running on port " + port);
});
