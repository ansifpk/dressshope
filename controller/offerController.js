const mongoose = require('mongoose')
const OfferDB = require("../model/offerModel");

const offer = async (req, res) => {
    try {
        const data = await OfferDB.find({});
        res.render('offer', { offer: data });
    } catch (error) {
        console.log(error.message);
    }
}

const loadaddOffer = async (req, res) => {
    try {
        res.render('addOffer')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOffer = async (req, res) => {
    try {
        const data = await OfferDB.find({});
        let value;
        const today = new Date();
        const offerPrice = req.body.offerPrice;
        const expiryDate = new Date(req.body.date);
        const exist = data.find((p) => p.iteam == req.body.offerIteam)

        if (!exist) {
            if (offerPrice >= 20 & offerPrice <= 70) {
                if (expiryDate.getFullYear() >= today.getFullYear() & expiryDate.getMonth() >= today.getMonth()) {
                    if(expiryDate.getFullYear() == today.getFullYear() & expiryDate.getMonth() == today.getMonth()){
                       if(expiryDate.getDate() >= today.getDate() & expiryDate.getDate()<=31 ){
                    const data = new OfferDB({
                        name: req.body.title,
                        iteam: req.body.offerIteam,
                        offerRate: req.body.offerPrice,
                        validity: req.body.date
                    });
                    await data.save();
                    res.redirect('/admin/offer');
                    
                       } else {
                           res.render('addOffer', { message: "Invalid Date" })
                       }
                    }else{
                        
                    const data = new OfferDB({
                        name: req.body.title,
                        iteam: req.body.offerIteam,
                        offerRate: req.body.offerPrice,
                        validity: req.body.date
                    });
                    await data.save();
                    res.redirect('/admin/offer');
                    }
            } else {
                res.render('addOffer', { message: "Invalid Date" })
            }
        }else{
            res.render('addOffer', { message: " Offer Rate Must Be More Than 20 And Below 70 " })
        }
        } else {
            res.render('addOffer', { message: "this iteam already have offer" })
        }


    } catch (error) {
        console.log(error.message);
    }
}


const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.query;
        await OfferDB.findByIdAndDelete({ _id: offerId });

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    offer,
    loadaddOffer,
    verifyOffer,
    deleteOffer,
}