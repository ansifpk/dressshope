const mongoose = require('mongoose');

const orderScheema = new mongoose.Schema({
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
        productStatus:{type:String,required:true,default:'pending',enum:['pending','canceled','Delivered','processing','return','shipping']},
        paymentStatus:{type:String,required:true,default:'Not paid',enum:['Not paid','Paid','Failed',]},
        productTotal:{
         type:Number,
        },
        quandity:{
        type:Number,      
        default:1
        },
     cancellationReason: {
        type: String,
        default: "none"
    },
    orderDate:{
        type:Date,
        require:true,
        default: new Date()
       },
    paymentMethod:{
        type:String,
        require:true
    },
    deliveryAddress:{
        type:Object,
        require:true
    },   
    }]

});

module.exports = mongoose.model('Order',orderScheema);