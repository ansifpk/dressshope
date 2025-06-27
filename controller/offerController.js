const mongoose = require('mongoose')
const OfferDB = require("../model/offerModel");
const CategoryDb = require("../model/categoryModel");
const ProductDb = require("../model/productModel");
const RefaralDB = require("../model/referalOfferModel");

const offer = async (req, res) => {
    try {
        const data = await OfferDB.find({}).sort({createdAt:-1});
        res.render('offer', { offer: data });
    } catch (error) {
        console.log(error.message);
    }
}

const loadaddOffer = async (req, res) => {
    try {
        const items = await ProductDb.find({is_listed:true})
        res.render('addOffer',{items})
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOffer = async (req, res) => {
    try {
        
        // let value;

        const {offerTitle,iteamName,offerPrice} = req.body
        const offer = await OfferDB.find({});
        const expiryDate = new Date(req.body.date);
        const today = new Date();
        
        const checkItemsProduct = await ProductDb.findOne({name:iteamName});
        const checkItemsCategory = await CategoryDb.findOne({name:iteamName});
        
        if(!checkItemsProduct && !checkItemsCategory){
            return res.json({success:false,message:"This iteam Not Found!."});
        }

        const exist = offer.find((p) => p.iteam == iteamName);
  
        if(exist){
           return res.json({success:false,message:"This iteam already have offer"});
        }

        if(offerPrice > 20 || offerPrice < 5 ){
             return res.json({success:false,message:"Offer Price Must be in Between 5% - 20%"});
        }
        
        if(today>=expiryDate){
             return res.json({success:false,message:"Invalid Expiry Date!."});
        }
 
         const data = new OfferDB({
                        name: offerTitle,
                        iteam: iteamName,
                        offerRate: offerPrice,
                        validity: expiryDate
                    });
         await data.save();
         return res.json({success:true,message:"Successfully Added the Offer!."});
         
        


    } catch (error) {
        console.log(error.message);
    }
}


const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.query;
        const data = await OfferDB.findByIdAndDelete({ _id: offerId });
        if(!data){
          return  res.json({success:false,message:"Offer Not Found!."})
        }
        res.json({success:true})
    } catch (error) {
        console.log(error.message);
    }
}
const selectOffer = async (req, res) => {
    try {
        const { item } = req.query;
        let datas;
        if(item == "Category"){
          datas =  await CategoryDb.find();
        }else{
          datas =  await ProductDb.find();
        }

        return res.json({success:true,data:datas});

    } catch (error) {
        console.log(error.message);
    }
}

const referalOffer = async (req, res) => {
    try {
      const refaralOffer = await RefaralDB.findOne();
      res.render("referalOffer",{refaralOffer})
    } catch (error) {
        console.log(error.message);
    }
}
const createReferalOffer = async (req, res) => {
    try {
     
      const refaralOffer = await RefaralDB.findOne();

      if(refaralOffer){
        return res.json({success:false,message:"ALready Have an Refaral Offer"})
      }

      const {ReferedUserPrice,NewUserPrice} = req.body;
      if(ReferedUserPrice < 50 || ReferedUserPrice > 300){
        return res.json({success:false,message:"ReferedUserPrice Must Be In Between 50 - 300"})
      }
      if(NewUserPrice < 50 || NewUserPrice > 300){
        return res.json({success:false,message:"NewUserPrice Must Be In Between 50 - 300"})
      }
      const offer = RefaralDB({
        newUserAmount:NewUserPrice,
        refaralUserAmount:ReferedUserPrice
      })
      await offer.save();
      
      return res.json({success:true,offer,message:"Refaral Offer Created Successfully!."})

    } catch (error) {
        console.log(error.message);
    }
}

const editReferalOffer = async (req, res) => {
    try {

      const {ReferedUserPrice,NewUserPrice,refaralId} = req.body;
      const checkRefaral = await RefaralDB.findOne({_id:refaralId});
      if(!checkRefaral){
         return res.json({success:false,message:"Refaral Offer Not Found!"})
      }
     
      if(ReferedUserPrice < 50 || ReferedUserPrice > 300){
        return res.json({success:false,message:"ReferedUserPrice Must Be In Between 50 - 300"})
      }
      if(NewUserPrice < 50 || NewUserPrice > 300){
        return res.json({success:false,message:"NewUserPrice Must Be In Between 50 - 300"})
      }
      await RefaralDB.findByIdAndUpdate({_id:refaralId},{
        newUserAmount:NewUserPrice,
        refaralUserAmount:ReferedUserPrice
      },{new:true});
      res.json({success:true,message:"SuccessFully Edited The Offer Price"});
    } catch (error) {
        console.log(error.message);
    }
}
const deleteReferalOffer = async (req, res) => {
    try {

      const {_id} = req.query;
      const checkRefaral = await RefaralDB.findOne({_id:_id});
      if(!checkRefaral){
         return res.json({success:false,message:"Refaral Offer Not Found!"})
      }
      await RefaralDB.findByIdAndDelete({_id:_id});
      res.json({success:true,message:"SuccessFully Delted The Refaral Offer"});

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    offer,
    loadaddOffer,
    verifyOffer,
    deleteOffer,
    selectOffer,
    referalOffer,
    editReferalOffer,
    createReferalOffer,
    deleteReferalOffer,
}