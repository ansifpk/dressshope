
const mongoose = require('mongoose');

const productModel = new mongoose.Schema({
    name:{
        type:String,
        required:true,
     },
     Description:{
    type:String,
    required:true
     },
     Price:{
        type:Number,
        require:true
     }, 
     image:{
          type:Array,
          require:true
     },
     is_listed:{
      type:Boolean,
      default:true
     },
     stock:{
      type:Number,
      default:5,
      require:true
     },
     categoryID:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"caregory"
     },
     orderCount:{
      type:Number,
      default:0,
     }
},{
   timestamps:true
});




module.exports = mongoose.model('products',productModel);
