
const mongoose = require('mongoose');

const wishlistModel = new mongoose.Schema({
   userId:{
     type:mongoose.Schema.Types.ObjectId,
     ref:"User",
     require:true
   },
   products:[{
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:'products'
        }
   }]
});

module.exports = mongoose.model('wishlist',wishlistModel);
