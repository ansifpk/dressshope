const mongoose =require("mongoose")
const OrderDB = require("../model/orderModel")
const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const OfferDB = require("../model/offerModel");
const WalletDB = require('../model/walletModel');
const WishlistDB = require('../model/wishlist')
const User = require("../model/userModel");
const CartDB = require('../model/cartModel');
const AddressDB = require('../model/addressModel');
const CoupenDB = require('../model/cuppenModel');

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



const addwishlist = async(req,res)=>{
    try {
        const {productId} = req.query;
       
         console.log(productId)
        const exists = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId');
        if(!exists){
            console.log("illa");
            const product = await ProductDB.findById({_id:productId});
            const data = new WishlistDB({
                userId:req.session.user_id,
                products:[{
                    productId:product._id
                }]
                
            });
            await data.save();
            res.send({added:true});
            
        }else{
            console.log("ind");
            const data = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId');
            const product = data.products.find((p)=>{
               return p.productId._id.equals(productId)
            });
           
            
            if(!product){
                console.log("product illa");
                console.log("add")
                const update = await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{productId:productId}}}).populate('products.productId');
               res.send({added:true});
        }else{
                console.log("product ind")
                console.log("remove")
                 await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{'products':{productId:productId}}}).populate('products.productId');
                const data = await WishlistDB.findOne({userId:req.session.user_id}).populate("products.productId")
                
                if(data.products.length==0){
                    console.log("delete")
                    await WishlistDB.findOneAndDelete({userId:req.session.user_id})
                    res.send({remove:true});
                }else{
                    console.log("delete akkanda")
                    res.send({remove:true});
                }
               
            }

        }
       
    } catch (error) {
        console.log(error.message);
    }
}



const deletewishlist = async(req,res)=>{
    try {
        const {productId} = req.query;
        console.log(productId);
        const product = await ProductDb.findById({_id:productId});
        await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{products:{productId:productId}}})
        const data = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId');
        if(data.products.length==0){
            await WishlistDB.findOneAndDelete({userId:req.session.user_id})
        }

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    wishlist,
    addwishlist,
    deletewishlist,
}