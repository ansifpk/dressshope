const CartDB = require("../model/cartModel");
const WishlistDB = require("../model/wishlist");
const OfferDB = require("../model/offerModel");

const getStoreDataForUser = async(req,res)=>{
     try {
         const cartData = await CartDB.findOne({userId: req.session.user_id}).populate({
             path: 'products.productId',
             populate: { path: 'categoryID' }})
            
         const wishlistData = await WishlistDB.findOne({userId:req.session.user_id})
         const offerData = await OfferDB.find({});
         const  cartTotal = cartData?.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
        },0);
         return {cartData,wishlistData,offerData,cartTotal}
     } catch (error) {
         console.error(error.message)
     }
 }

module.exports = getStoreDataForUser;