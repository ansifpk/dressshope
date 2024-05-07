const mongoose = require('mongoose');

const offerModel = mongoose.Schema({
    name:{ type:String,require:true },
    iteam:{type:String,require:true},
    offerRate:{type:String,require:true},
    validity:{type:String,require:true}

});

module.exports=mongoose.model('offer',offerModel);