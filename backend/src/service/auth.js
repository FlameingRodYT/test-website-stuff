const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {

    const token = req.cookies.accessToken;

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; //attach user info to request
        next();             //like chain.doFilter() in Spring, aka this is the key, then continue
    } catch (err) {
        return res.status(401).json({ error: 'Token Expired' });
    }
};

module.exports = authenticateToken;