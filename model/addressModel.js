
const mongoose = require('mongoose');

const addressModel = new mongoose.Schema({
    
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:'User'
    },
    address:[{
        fname:{
            type:String,
            require:true
        },
        lname:{
            type:String,
            require:true
        },
        address:{
            type:String,
            require:true
        },
        country:{
            type:String,
            require:true
        },
        city:{
           
                type:String,
                require:true
           
        },
        state:{
            type:String,
            require:true
        },
        pincode:{
            type:Number,
            require:true
        },
        mobile:{
            type:Number,
            require:true
        },
        email:{
            type:String,
            require:true
        }
    }]
    
});

module.exports=mongoose.model('address',addressModel);