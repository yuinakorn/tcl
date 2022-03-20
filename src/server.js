"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var Https = require("https");
var express = require("express");
var socketIo = require("socket.io");
var dotEnv = require("dotenv");
var bodyParser = require("body-parser");
var path = require("path");
var Req = require("request");
var query = require("./v1.0/models/CScript");
var fs = require("fs");
dotEnv.config();
var SECRET_KEY = process.env.SECRET_KEY;
var privateKey = fs.readFileSync('/etc/nginx/certs/sync.chiangmaihealth.go.th.key', 'utf8');
var certificate = fs.readFileSync('/etc/nginx/certs/sync.chiangmaihealth.go.th.crt', 'utf8');
var SocketServer = /** @class */ (function () {
    function SocketServer() {
        this.Client = new Map();
        this.ResultData = new Map();
        this.HosOnline = new Array();
        this.HospCodeOnline = new Map();
        this.credentials = { key: privateKey, cert: certificate };
        this.createApp();
        this.createServer();
        this.sockets();
        this.listen();
    }
    SocketServer.prototype.getApp = function () {
        return this.app;
    };
    SocketServer.prototype.createApp = function () {
        var _this = this;
        this.app = express();
        this.app.use(express.json());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'assets')));
        this.app.set('ResultData', this.ResultData);
        this.app.set('ClientOnline', this.Client);
        this.app.get('/', function (req, res) {
            res.sendFile(path.resolve('./views/index.html'));
        });
        this.app.get('/about', function (req, res) {
            res.sendFile(path.resolve('./views/about.html'));
        });
        this.app.use('/api/v1.0', function (req, res, next) {
            next();
        }, require('./v1.0/route'));
        this.app.post('/result', function (req, res) {
            console.log('\n\x1b[33mResult from Client by Result ID\x1b[0m : \x1b[35m%s\x1b[0m', req.body.result_id);
            var ChkData = _this.ResultData.get(req.body.result_id);
            if (ChkData == undefined) {
                _this.ResultData.set(req.body.result_id, req.body.data);
            }
            else {
                _this.ResultData.set(req.body.result_id, ChkData.concat(req.body.data));
            }
            res.sendStatus(201);
        });
        this.app.get('/results/:id', function (req, res) {
            console.log('\nGet Result ID : \x1b[35m%s\x1b[0m', req.params.id);
            var id = parseInt(req.params.id);
            var result = _this.ResultData.get(id);
            if (result != null) {
                res.jsonp(_this.ResultData.get(id));
                _this.ResultData.delete(id);
            }
            else {
                console.log('\n\x1b[31mResult Not Found !!\x1b[0m');
                res.sendStatus(404);
            }
        });
    };
    SocketServer.prototype.createServer = function () {
        this.httpServer = http_1.createServer(this.app);
        this.httpsServer = Https.createServer(this.credentials, this.app);
        this.port = process.env.PORT || SocketServer.PORT;
    };
    SocketServer.prototype.sockets = function () {
        var _this = this;
        this.io = socketIo(this.httpServer, {
            serveClient: false,
            cookie: false,
        });
        setInterval(function () {
            var e_1, _a;
            try {
                // @ts-ignore
                for (var _b = __values(_this.ResultData), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), id = _d[0], data = _d[1];
                    var now = Date.now();
                    var minute = now - id;
                    if (minute > (60 * 1000)) {
                        _this.ResultData.delete(id);
                        console.log('\n\x1b[31mDelete ResultData id : %s\x1b[0m', id);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, 60000);
    };
    SocketServer.prototype.listen = function () {
        var _this = this;
        this.httpServer.listen(this.port, function () {
            console.log('Runing Server on port %s', _this.port);
        });
        this.httpsServer.listen(443, function () {
            console.log('Runing Https Server on port 443');
        });
        this.io.on('connect', function (clientSockget) {
            console.log('\nConnect from ID : \x1b[35m%s\x1b[0m', clientSockget.id);
            _this.Client.set(clientSockget.handshake.headers.hospcode, clientSockget);
            clientSockget.on('joinroom', function (room) {
                console.log('Client ID : \x1b[35m%s\x1b[0m ,Hoscode : \x1b[35m%s\x1b[0m join room \x1b[33m%s\x1b[0m', clientSockget.id, clientSockget.handshake.headers.hospcode, room.name);
                clientSockget.join(room.name);
            });
            clientSockget.on('getsql', function (params) {
                console.log('getSql & return result');
                var client = _this.Client.get(params.id);
                _this.ResultData.set(params.id, "Select * from query123");
            });
            clientSockget.on('getreportname', function (params) {
                var client = _this.Client.get(params.id);
            });
            clientSockget.on('api', function (params) {
                // @ts-ignore
                query.getSqlByHisName();
            });
            clientSockget.on('disconnect', function () {
                clientSockget.leaveAll();
                _this.Client.delete(clientSockget.handshake.headers.hospcode);
                console.log('\nID \x1b[31m%s\x1b[0m Disconnect', clientSockget.id);
            });
        });
    };
    SocketServer.prototype.ListClient = function () {
        // console.log('List Client')
        var client = this.io.nsps['/'].adapter;
        // console.log(client)
    };
    SocketServer.prototype.PostResult = function (result_id, result) {
        var data = JSON.parse(JSON.stringify(result));
        if (data) {
            Req.post(process.env.SERVER_URL + "/result", { json: { result_id: result_id, data: data } }, function (err, res, body) {
                if (res.statusCode == 201) {
                    console.log('\nEvent \x1b[33m%s\x1b[0m', event);
                    console.log("\x1b[36m");
                    console.log(JSON.stringify(result));
                    console.log("\x1b[0m");
                    console.log('Status Code \x1b[33m%s\x1b[0m', res.statusCode);
                }
            });
        }
    };
    SocketServer.PORT = parseInt(process.env.SERVER_PORT);
    return SocketServer;
}());
exports.SocketServer = SocketServer;
