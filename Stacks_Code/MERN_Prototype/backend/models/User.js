const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email:{ type:String, required:true, unique:true, lowercase:true, trim:true },
  passwordHash:{ type:String, required:true, select:false },
  role:{ type:String, enum:["member","beneficiary"], required:true },
  tokenBalance:{ type:Number, default:0 }
});

// verify password
userSchema.methods.verifyPassword = function(plain){
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
