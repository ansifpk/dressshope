const mongoose = require('mongoose')
const CoupenDB = require("../model/cuppenModel");



const coupens = async (req, res) => {
    try {
        const data = await CoupenDB.find({});
        console.log(new Date(data[3].expiryDate).toLocaleDateString())
        res.render('coupens', { data: data });
    } catch (error) {
        console.log(error.message);
    }
}


const loadaddCuppen = async (req, res) => {
    try {
        res.render('addCuppen')
    } catch (error) {
        console.log(error.message);
    }
}
const applyCoupon = async (req, res) => {
    try {
        const {couponCode,amount} = req.body;
        const checkCoupon = await CoupenDB.findOne({coupenId:couponCode})
        if(!checkCoupon){
            return res.json({success:false,message:"Invalid Coupon Code!."})
        }
        // HKyYAfbE Xx2AFiXu eMMncJ00
        const today = new Date();
      
        if(new Date(checkCoupon.expiryDate).getFullYear()==today.getFullYear()&&new Date(checkCoupon.expiryDate).getMonth()==today.getMonth()&&new Date(checkCoupon.expiryDate).getDate()<today.getDate()){
            return res.json({success:false,message:"Coupon Expired!."})
        }

        if(new Date(checkCoupon.expiryDate).getFullYear()>=today.getFullYear()&&new Date(checkCoupon.expiryDate).getMonth()>=today.getMonth()){
            
            if(checkCoupon.minLimite>amount){
                return res.json({success:false,message:`You need to purchase more than ${checkCoupon.minLimite} to use this coupon!.`})
            }
            if(checkCoupon.usedUsers.includes(req.session.user_id)){
                return res.json({success:false,message:`Coupon Already used!.`})
            }
            return res.json({success:true,coupon:checkCoupon,message:"Successfully Applied Coupon"})
        }else{
            return res.json({success:false,message:"Coupon Expired!."})
        }

        
        
    } catch (error) {
        console.log(error.message);
    }
}


const addCuppen = async (req, res) => {
    try {
        const offerPrice = req.body.offerPrice * 1;
        const expiryDate = new Date(req.body.date);
        const today = new Date();

        if (offerPrice >= 20 & offerPrice <= 70) { 
            if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                        const data = new CoupenDB({
                            name: req.body.name,
                            expiryDate: expiryDate,
                            offer: offerPrice,
                            status:"active",
                            minLimite: req.body.max,
                            image: req.file.filename,
                            coupenId: req.body.coupenId,
                        });
                        await data.save();
                        res.redirect('/admin/coupens')

                       }else{
                        res.render('addCuppen', { message: "Invalid Date month" })
                       }
                       
                    }else{
                        const data = new CoupenDB({
                                name: req.body.name,
                                expiryDate: expiryDate,
                                offer: offerPrice,
                                status:"active",
                                minLimite: req.body.max,
                                image: req.file.filename,
                                coupenId: req.body.coupenId,
                            });
                            await data.save();
                            res.redirect('/admin/coupens')
                    }
                          
                
            } else {
                res.render('addCuppen', { message: "Invalid Date year" })

            }
        } else {
            res.render('addCuppen', { message: " Offer Rate Must Be More Than 20 And Below 70 " })
        }

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
            const data = await CoupenDB.findById({ _id: req.query.id });
            const alreadyImage = data.image;
            const today = new Date();
            const offerPrice = req.body.offerPrice;
            const expiryDate = new Date(req.body.validity);
            if (req.file) {
                if (offerPrice >= 20 & offerPrice <= 70) {
                    if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                        if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                           if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                            const data = await CoupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                            $set: {
                                name: req.body.name,
                                expiryDate: req.body.validity,
                                offer: offerPrice,
                                minLimite: req.body.min,
                                image: req.file.filename,
                                coupenId: req.body.coupenId,
                            }
                           });
                           res.redirect('/admin/coupens');
                        
                        }else{
                            res.render('editCoupens', { message: "Invalid Date", data: data })
                           }
                        }else{
                            
                        const data = await CoupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                            $set: {
                                name: req.body.name,
                                expiryDate: req.body.validity,
                                offer: offerPrice,
                                minLimite: req.body.min,
                                image: req.file.filename,
                                coupenId: req.body.coupenId,
                            }
                        });
                        res.redirect('/admin/coupens');
                        }
                    } else {
                        res.render('editCoupens', { message: "Invalid Date", data: data })
    
                    }
                } else {
                    res.render('editCoupens', { message: " Offer Rate Must Be More Than 20 And Below 70 ", data: data })
                }
    
            } else {
                if (offerPrice >= 20 & offerPrice <= 70) {
                    if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                        if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                           if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                            const data = await CoupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                            $set: {
                                name: req.body.name,
                                expiryDate: req.body.validity,
                                offer: offerPrice,
                                minLimite: req.body.min,
                                image: alreadyImage,
                                coupenId: req.body.coupenId,
                            }
                           });
                           res.redirect('/admin/coupens');
                        
                        }else{
                            res.render('editCoupens', { message: "Invalid Date", data: data })
                           }
                        }else{
                            
                        const data = await CoupenDB.findByIdAndUpdate({ _id: req.query.id }, {
                            $set: {
                                name: req.body.name,
                                expiryDate: req.body.validity,
                                offer: offerPrice,
                                minLimite: req.body.min,
                                image: alreadyImage,
                                coupenId: req.body.coupenId,
                            }
                        });
                        res.redirect('/admin/coupens');
                        }
                    } else {
                        res.render('editCoupens', { message: "Invalid Date", data: data })
    
                    }
                } else {
                    res.render('editCoupens', { message: " Offer Rate Must Be More Than 20 And Below 70 ", data: data })
                }
            }
    
        } catch (error) {
            console.log(error.message);
        }
    }

    
const deleteCoupen = async (req, res) => {
    try {

        const { id } = req.query;
        await CoupenDB.findByIdAndDelete({ _id: id });

    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    coupens,
    addCuppen,
    loadaddCuppen,
    loadeditCuppen,
    editCuppen,
    deleteCoupen,
    applyCoupon
}