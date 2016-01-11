var jwt = require('jwt-simple');
var isUser = require('../routes/auth').isUser;

function isSignupPage(req) {
    return req.url == '/users' && req.method == 'POST'
}

module.exports = function(req, res, next) {
    // When performing a cross domain request, you will recieve
    // a preflighted request first. This is to check if our the app
    // is safe. 
    // We skip the token outh for [OPTIONS] requests.
    //if(req.method == 'OPTIONS') next();
    var token = req.headers['x-access-token'];
    var email = req.headers['x-key'];
    try {
        if (isSignupPage(req)) {
            next();
        } else {
            var decoded = jwt.decode(token, require('../config/secret.js')());
            if (!token)                    throw "No token provided"
            if (decoded.exp <= Date.now()) throw "Token Expired"
            if (email !== decoded.email)   throw "Corrupted token"
            isUser(decoded.email, function (err, user) {
                if (err) {
                    res.status(401);
                    res.json({
                        "status": 401,
                        "message": err
                    });
                    return;
                } else {
                    req.user = user;
                    next();
                }
            });
        }
    } catch (err) {
        res.status(401);
        res.json({
            "status": 401,
            "message": err
        });
        return;
    }
};