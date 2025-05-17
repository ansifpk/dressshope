const ProductDb = require("../model/productModel");
const OfferDB = require("../model/offerModel");
const WishlistDB = require('../model/wishlist');
const CartDB = require('../model/cartModel');

const wishlist = async(req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
            cartTotal = cartData.products.reduce((acc,productsId)=>{
            parseInt(productsId.quandity);
             parseInt(productsId.productId.Price);
             const offer = offerData.find( value => value.iteam === productsId.productId.name ||  value.iteam === productsId.productId.categoryID.name)
           if(offer){
            return acc+productsId.quandity*productsId.productId.Price - Math.round(productsId.quandity*productsId.productId.Price*offer.offerRate/100)
           }else{
            return acc+productsId.quandity*productsId.productId.Price
           }
        },0);

    }

        res.render('wishlist',{wishlistData:wishlistData,cartData:cartData,cartTotal});

    } catch (error) {
        console.log(error.message);
    }
}



const handleWishlist = async(req,res)=>{
    try {
        const {productId} = req.query;
        const checkUser = await WishlistDB.findOne({userId:req.session.user_id})
        const checkProduct = await ProductDb.findById({_id:productId})
         if(!checkUser){
            return res.json({success:false,message:"Cart Not Found"})
         }
         if(!checkProduct){
            return res.json({success:false,message:"Product Not Found"})
         }
         const product = await WishlistDB.findOne({userId:req.session.user_id,'products.productId':{$in:[productId]}})
         if(!product){
            const newWishlist = await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{productId:productId}}},{new:true})
            res.json({success:true,added:true,totelProducts:newWishlist.products.length})
         }else{
            const newWishlist = await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{'products':{productId:productId}}},{new:true})
            res.json({success:true,removed:true,totelProducts:newWishlist.products.length})
         }
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    wishlist,
    handleWishlist,
    
}