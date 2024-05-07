const mongoose = require('mongoose');

const walletModel =  mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        require:true
    },
    Balance:{
        type:Number,
        default:0,
    },
    walletHistery:{
        type:Array,
    }
});

module.exports = mongoose.model('wallet',walletModel);