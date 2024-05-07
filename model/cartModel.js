const mongoose = require('mongoose');

const cartModel = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:'User'
    },
    products:[{
        productId:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:'products'
        },
    quandity:{
       type:Number,
       require:true,
       default:1
    }
    }]
});

module.exports =mongoose.model('Cart',cartModel);


