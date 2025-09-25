const { Timestamp } = require('bson');
const mongoose = require('mongoose');

const offerModel = mongoose.Schema({
    name:{ type:String,require:true },
    iteam:{type:String,require:true},
    offerRate:{type:String,require:true},
    validity:{type:Date,require:true}
},{
   timestamps:true,
});

module.exports=mongoose.model('offer',offerModel);