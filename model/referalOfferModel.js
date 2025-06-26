
const mongoose = require('mongoose');

const referalOfferModel = new mongoose.Schema({
   
    newUserAmount:{
        type:Number,
        required:true
    },
    refaralUserAmount:{
    type:Number,
        required:true
    },
    
},{
   timestamps:true
});

module.exports = mongoose.model('referalOffer',referalOfferModel);

