const mongoose=require('mongoose');

const userSchema= new mongoose.Schema({

     name:{
        type:String,
        required:true,
        
     },
     email:{
        type:String,
        required:true,
        
     },
     mobile:{
        type:String,
        required:true,
        
     },
     password:{
        type:String,
        required:true,
        
     },
     is_admin:{
        type:Number,
        default:0,
        required:true,
     },
     is_blocked:{
      type:Boolean,
      default:false,
     },
     is_verified:{
        type:Boolean,
        default:true,
     },
     reffaralCode:{
        type:String,
        required:true,
     },
     createdAt:{
         type:Date,
         default:new Date()
     },
     token:{
      type:String,
      default:''
     }

});
module.exports = mongoose.model('User',userSchema);

