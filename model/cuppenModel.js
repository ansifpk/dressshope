
const mongoose = require('mongoose');

const cupenModel = new mongoose.Schema({
   
name:{
    type:String,
    require:true
 },
 status:{
    type:Date,enum:['active','expired']
   
 },
 expiryDate:{
    type:String,
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
   // ref: 'User',
   default: [],
 },

});

module.exports = mongoose.model('cupen',cupenModel);

