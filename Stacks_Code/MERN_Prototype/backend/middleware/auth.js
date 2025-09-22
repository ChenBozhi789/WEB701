const jwt = require('jsonwebtoken');

// middleware to require authentication
function requireAuth(req, res, next){
  try{
    // Support both cookie and Authorization header
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = bearer || req.cookies?.jwt;

    // if no token, return 401
    if(!token) return res.status(401).json({message:"No token"});

    // verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = { id: payload.sub, role: payload.role };

    // if valid, set req.user
    next();
  }catch{
    // if invalid, return 401
    res.status(401).json({message:"Invalid/expired token"});
  }
}

module.exports = { requireAuth };