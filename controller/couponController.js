const mongoose = require('mongoose')
const CupenDB = require("../model/cuppenModel");



const coupens = async (req, res) => {
    try {
        const data = await CupenDB.find({});
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


const addCuppen = async (req, res) => {
    try {
        const offerPrice = req.body.offerPrice * 1;
        const expiryDate = new Date(req.body.date);
        const today = new Date();
        if (offerPrice >= 20 & offerPrice <= 70) { 
            if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                        const data = new CupenDB({
                            name: req.body.name,
                            expiryDate: req.body.date,
                            offer: offerPrice,
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
                        const data = new CupenDB({
                                name: req.body.name,
                                expiryDate: req.body.date,
                                offer: offerPrice,
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
            const data = await CupenDB.findById({ _id: req.query.id });
            res.render('editCoupens', { data: data })
        } catch (error) {
            console.log(error.message);
        }
}
    
    
    const editCuppen = async (req, res) => {
        try {
            const data = await CupenDB.findById({ _id: req.query.id });
            const alreadyImage = data.image;
            const today = new Date();
            const offerPrice = req.body.offerPrice;
            const expiryDate = new Date(req.body.validity);
            if (req.file) {
                if (offerPrice >= 20 & offerPrice <= 70) {
                    if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                        if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                           if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                            const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
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
                            
                        const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
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
                            const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
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
                            
                        const data = await CupenDB.findByIdAndUpdate({ _id: req.query.id }, {
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
        await CupenDB.findByIdAndDelete({ _id: id });

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
}