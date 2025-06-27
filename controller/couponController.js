const mongoose = require('mongoose')
const CoupenDB = require("../model/cuppenModel");
const CartDB = require("../model/cartModel");
const getStoreDataForUser = require('../helperfunctions/helper');
const cloudineryHelper = require('../helperfunctions/cloudinry');



const coupons = async (req, res) => {
    try {
        const count = await CoupenDB.find({}).countDocuments();
        const limit = 3;
        const data = await CoupenDB.find({}).sort({createdAt:-1}).limit(limit);
        res.render('coupons', { data: data , totalPage:Math.ceil(count/limit)});
    } catch (error) {
        console.log(error.message);
    }
}


const loadaddCoupons = async (req, res) => {
    try {
        res.render('addCuppen')
    } catch (error) {
        console.log(error.message);
    }
}
const applyCoupon = async (req, res) => {
    try {
        const {couponCode} = req.body;
        const checkCoupon = await CoupenDB.findOne({couponCode:couponCode});
        if(!checkCoupon){
            return res.json({success:false,message:"Invalid Coupon Code!."});
        }
        const {cartTotal} = await getStoreDataForUser(req,res);
        console.log(checkCoupon,"totle",)
        // HKyYAfbE Xx2AFiXu eMMncJ00 
        const today = new Date();
      
        if(new Date(checkCoupon.expiryDate).getFullYear()==today.getFullYear()&&new Date(checkCoupon.expiryDate).getMonth()==today.getMonth()&&new Date(checkCoupon.expiryDate).getDate()<today.getDate()){
            return res.json({success:false,message:"Coupon Expired!."})
        }

        if(new Date(checkCoupon.expiryDate).getFullYear()>=today.getFullYear()&&new Date(checkCoupon.expiryDate).getMonth()>=today.getMonth()){
            
            if(checkCoupon.minLimite>cartTotal){
                return res.json({success:false,message:`You need to purchase more than ${checkCoupon.minLimite} to use this coupon!.`})
            }
            if(checkCoupon.usedUsers.includes(req.session.user_id)){
                return res.json({success:false,message:`Coupon Already used!.`})
            }
             const offerPrice = Math.floor(cartTotal*checkCoupon.offer/100);
             return res.json({success:true,offerPrice,total:cartTotal-offerPrice,couponId:checkCoupon._id,message:"Successfully Applied Coupon"})
        }else{
            return res.json({success:false,message:"Coupon Expired!."})
        }

        
        
    } catch (error) {
        console.log(error.message);
    }
}


const addCuppen = async (req, res) => {
    try {

        const {title,coupenCode,date,min} = req.body;
        let offerPrice = req.body.offerPrice*1
        const expiryDate = new Date(req.body.date);
        const today = new Date();

        if(offerPrice < 5 && offerPrice > 20){
           return res.json({success:false,message: " Offer Rate Must Be In Between 5 And 20 "});
        }

        if(today>=expiryDate){
          return res.json({success:false,message: " Invalid Date "});
        }
        
         
        const {secure_url,public_id} = await cloudineryHelper(req.file.path,"ecommerceCouponImages");

        const data = new CoupenDB({
                            name: title,
                            expiryDate: expiryDate,
                            offer: offerPrice,
                            status:"active",
                            minLimite: min,
                            image: {
                                secure_url,
                                public_id
                            },
                            couponCode:coupenCode,
                        });
             await data.save();
           return res.json({success:true,message: " Coupon Created Successfully!. "});
         
    } catch (error) {
        console.log(error.message);
    }
}

const loadeditCuppen = async (req, res) => {
        try {
            const data = await CoupenDB.findById({ _id: req.query.id });
            res.render('editCoupens', { data: data })
        } catch (error) {
            console.log(error.message);
        }
}
    
    
    const editCuppen = async (req, res) => {
        try {

            const {couponId} = req.query;
            const {title,couponCode,min,date} = req.body;
            const today = new Date();
            const offerPrice = req.body.offerPrice*1
            const expiryDate = new Date(date);
            
             const coupon = await CoupenDB.findById({ _id: couponId});
             let couponImage = {};
             if(!coupon){
                return res.json({success:false,message: " Coupon Not Found!. "});
             }
               couponImage = coupon.image;
              if(offerPrice < 5 && offerPrice > 20){
               return res.json({success:false,message: " Offer Rate Must Be In Between 5 And 20 "});
             }

            if(today>=expiryDate){
              return res.json({success:false,message: " Invalid Date "});
            }

            if(req.file){
              const {secure_url,public_id} = await cloudineryHelper(req.file.path,"ecommerceCouponImages");
              couponImage.secure_url = secure_url
              couponImage.public_id = public_id
            }

             
                          await CoupenDB.findByIdAndUpdate({ _id: couponId }, {
                            $set: {
                                name: title,
                                expiryDate: date,
                                offer: offerPrice,
                                minLimite: min,
                                image:  couponImage,
                                couponCode: couponCode,
                            }
                           });
            res.json({success:true,message: " Successfully Updated The Coupon "});
    
        } catch (error) {
            console.log(error.message);
        }
    }

    
const deleteCoupen = async (req, res) => {
    try {

        const { couponId } = req.body;
        const limit = 3;
        const coupon = await CoupenDB.findByIdAndDelete({ _id: couponId });
        if(!coupon){
            res.json({success:false,message:"Coupon Not Found!."});
        }

        const count = await CoupenDB.find()
        const totalPage = Math.ceil(count/limit)
        const coupons = await CoupenDB.find().sort({createdAt:-1}).limit(limit)
        
        res.json({success:true,coupons,totalPage,message:"Coupon Deleted Successfully!."});

        

    } catch (error) {
        console.log(error.message);
    }
}

const searchCoupon = async (req, res) => {
    try {

               const { search } = req.query;
               let limit = 3;
               const count = await CoupenDB.find({ name: { $regex: ".*" + search + ".*", $options: "i" }}).countDocuments()
               const coupons = await CoupenDB.find({ name: { $regex: ".*" + search + ".*", $options: "i" }}).sort({createdAt:-1}).limit(limit)
              
               return res.json({coupons,totelPage:Math.ceil(count/limit)});
    } catch (error) {
        console.log(error.message);
    }
}

const filterAndsortCoupon = async (req, res) => {
    try {
       
                    const { filter,sort,search} = req.query;
                    let coupons
                    let totelPage = 0;
                    const limit = 3;
                    const query = {};
                    const date = new Date();
               
                   switch (sort) {
                       case "Name Z - A":
                       query.name = -1;
                       break;
                       case "Name A - Z":
                       query.name = 1;
                       break;
                       case "Old":
                       query.createdAt = 1;
                       break;
                       default:
                       query.createdAt = -1;
                       break;
                   }
               
               
                    if(filter == "Active"){
                       coupons = await CoupenDB.find({$and:[{expiryDate:{$gte:date}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).limit(limit)
                    }else if(filter == 'Expired'){
                       coupons = await CoupenDB.find({$and:[{expiryDate:{$lt:date}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).limit(limit)
                    }else{
                       coupons = await CoupenDB.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).limit(limit)
                    }
               
                    totelPage = Math.ceil(coupons.length/limit);
                    
                    res.json({coupons,totelPage:totelPage})
    } catch (error) {
        console.log(error.message);
    }
}

const couponPagination = async (req, res) => {
    try {
       
                    const { filter,sort,search,page} = req.query;
                    let coupons
                    const limit = 3;
                    const query = {};
                    const date = new Date();
               
                   switch (sort) {
                       case "Name Z - A":
                       query.name = -1;
                       break;
                       case "Name A - Z":
                       query.name = 1;
                       break;
                       case "Old":
                       query.createdAt = 1;
                       break;
                       default:
                       query.createdAt = -1;
                       break;
                   }
               
               
                    if(filter == "Active"){
                       coupons = await CoupenDB.find({$and:[{expiryDate:{$gte:date}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).skip((page-1)*limit).limit(limit*page)
                    }else if(filter == 'Expired'){
                       coupons = await CoupenDB.find({$and:[{expiryDate:{$lt:date}},{ name: { $regex: ".*" + search + ".*", $options: "i" }}]}).sort(query).skip((page-1)*limit).limit(limit*page)
                    }else{
                       coupons = await CoupenDB.find({name: { $regex: ".*" + search + ".*", $options: "i" }}).sort(query).skip((page-1)*limit).limit(limit*page)
                    }
    
                    res.json({coupons})
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    coupons,
    addCuppen,
    loadaddCoupons,
    loadeditCuppen,
    editCuppen,
    deleteCoupen,
    applyCoupon,
    searchCoupon,
    filterAndsortCoupon,
    couponPagination
}