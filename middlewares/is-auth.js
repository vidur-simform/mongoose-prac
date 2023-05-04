const jwt = require('jsonwebtoken');

exports.isAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        console.error("hi")

        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken  = jwt.verify(token, 'somesecret');

    }catch(err){
        const error = new Error('Not authorized.');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
};