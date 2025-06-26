
const mongoose = require('mongoose');

const cupenModel = new mongoose.Schema({
   
name:{
    type:String,
    required:true
 },
 status:{
    type:String,
    enum:['active','expired','used'],
    required:true
 },
 expiryDate:{
    type:Date,
    required:true
 },
 offer:{
    type:Number,
    required:true
 },
 image:{
   secure_url:{
    type:String,
    required:true
   },
   public_id:{
    type:String,
    required:true
   }
 },
 minLimite:{
    type:Number,
    required:true
 },
 couponCode:{
    type:String,
    required:true
 },
 usedUsers: {
   type:  [mongoose.Schema.Types.ObjectId],
   ref:"User",
   default: [],
 },

},{
   timestamps:true
});

module.exports = mongoose.model('cupen',cupenModel);

