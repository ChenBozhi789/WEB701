const jwt = require('jsonwebtoken');

function requireAuth(req, res, next){
  try{
    // get token from Authorization header or Cookie
    const bearer = req.headers.authorization?.split(' ')[1]; // like Postman header: Authorization: Bearer <token>
    const token = bearer || req.cookies?.jwt;

    // deny access if no token
    if(!token) return res.status(401).json({message:"No token"});

    // verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    
    // check if the token contains the required user ID
    if (!payload.sub) {
      return res.status(401).json({message:"Invalid token: missing user ID"});
    }
    
    // save user information to req.user
    req.user = { id: payload.sub, role: payload.role };

    next();
  } catch(err){
    // deny access if verification fails
    console.error('Auth middleware error:', err.message);
    res.status(401).json({message:"Invalid/expired token"});
  }
}

module.exports = { requireAuth };