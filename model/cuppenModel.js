
const mongoose = require('mongoose');

const cupenModel = new mongoose.Schema({
   
name:{
    type:String,
    require:true
 },
 status:{
    type:String,
    enum:['active','expired','used'],
    require:true
 },
 expiryDate:{
    type:Date,
    require:true
 },
 offer:{
    type:Number,
    require:true
 },
 image:{
    type:String,
    require:true
 },
 minLimite:{
    type:Number,
    require:true
 },
 coupenId:{
    type:String,
    require:true
 },
 usedUsers: {
   type: Array,
   default: [],
 },

},{
   timestamps:true
});

module.exports = mongoose.model('cupen',cupenModel);

