const mongoose = require('mongoose')
const UserDb = require("../model/userModel");
const ProductDb = require("../model/productModel");
const CategoryDb = require("../model/categoryModel");
const OrderDB = require('../model/orderModel');
const CupenDB = require('../model/cuppenModel');
const OfferDB = require('../model/offerModel');
const bcrypt = require('bcrypt');
const exceljs = require('exceljs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const randomstring = require('randomstring');
const { log } = require('console');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}


const adminLogin = async (req, res) => {
    try {

        res.render('adminLogin')
    } catch (error) {
        console.log(error.message)

    }
}

const veryfyLogin = async (req, res) => {
    try {

        const password = req.body.password
        const email = req.body.email;
        const userData = await UserDb.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_admin == 0) {
                    res.render('adminLogin', { message: 'You Are Not Admin' });
                } else {
                    req.session.admin_id = userData._id;
                    res.redirect('/admin/dashboard')
                }
            } else {
                res.render('adminLogin', { message: "Incorrect Password" });
            }
        } else {
            res.render('adminLogin', { message: "You are not registered" });
        }
    } catch (error) {
        console.log(error.message)

    }
}

const viewUser = async (req, res) => {
    try {

        var search = '';
        if (req.query.search) {
            search = req.query.search
        }

        let page;
        if (req.query.page) {
            page = req.query.page;
        }
      
         
        const limit = 2;

        const userData = await UserDb.find({
            is_admin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();



        const count = await UserDb.find({
            is_admin: false,
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { mobile: { $regex: '.*' + search + '.*', $options: 'i' } },

            ]
        }).countDocuments();


        res.render('usersList', {
            userData: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })
    } catch (error) {
        console.log(error.message)

    }
}

const dashboard = async (req, res) => {
    try {

        const {filter} = req.query;
        let data;
        let date;
        if(!filter||filter == 'Yearly'){
           data = "nulll"
        }else if(filter == "Monthly"){
             date = new Date().getMonth()+1;
            data = "Monthly"
           
        }
        const orderData = await OrderDB.find({}).populate("products.productId");
        const categoryData = await CategoryDb.find({});
        let arrayProducts = [];
        let arrayCategory = [];
        for (let i = 0; i < orderData.length; i++) {
            for (let j = 0; j < orderData[i].products.length; j++) {
                if (orderData[i].products[j].productStatus == "Delivered") {
                    arrayProducts.push({ count: orderData[i].products[j].productId.orderCount, name: orderData[i].products[j].productId.name, image: orderData[i].products[j].productId.image[0] })
                }
            }
        }
        const uniqueProducts = new Set(arrayProducts.map(JSON.stringify));
        let spreadArray = [...uniqueProducts].map(JSON.parse);
      
        const top10Product = spreadArray.sort((a, b) => b.count - a.count).slice(0, 10);

        categoryData.forEach((value) => arrayCategory.push({ count: value.orderCount, name: value.name }))

        const top10Category = arrayCategory.sort((a, b) => b.count - a.count).slice(0, 10);
        res.render('dashboard', { dbData: orderData, arrayCount: top10Product, top10Category: top10Category ,data,date});

    } catch (error) {
        console.log(error.message)

    }
}

const chart = async (req, res) => {
    try {
        const { status } = req.query;
        const orderData = await OrderDB.find({});
        let dataSend = [];
        if (status == "Filter" || status == "Yearly") {
            console.log("Yearly")
            res.send({ status: "Monthly", dataSend: dataSend });
        } else {
            const Month = new Date().getMonth()

            for (let i = 0; i < orderData.length; i++) {
                for (let j = 0; j < orderData[i].products.length; j++) {
                    if (new Date(orderData[i].products[j].orderDate).getMonth() + 1 == Month + 1) {
                        dataSend.push(orderData[i].products[j])
                    }
                }
            }

            res.send({ status: "Monthly", dataSend: dataSend });
        }

    } catch (error) {
        console.log(error.message)

    }
}

const blockUser = async (req, res) => {
    try {
        const { userId } = req.query

        const data = await UserDb.findOne({ _id: userId })

        data.is_blocked = !data.is_blocked


        data.save();
        res.redirect("/admin/viewUser")

    } catch (error) {
        console.log(error.message)

    }
}




const loadaddUser = async (req, res) => {
    try {
        res.render('addUser')
    } catch (error) {
        console.log(error.message)

    }
}



const addUser = async (req, res) => {
    try {

        if (/^[A-Za-z]+(?:[A-Za-z]+)?$/.test(req.body.name)) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
                const emailCheck = await UserDb.findOne({ email: req.body.email });
                if (!emailCheck) {
                    const mobileLength = (req.body.mobile).length;
                    if (mobileLength < 11) {
                        const passwordLength = (req.body.password).length;
                        if (passwordLength > 4) {
                            const userData = new UserDb({
                                name: req.body.name,
                                email: req.body.email,
                                password: req.body.password,
                                mobile: req.body.mobile,

                            });
                            const user = await userData.save();
                            if (user) {
                                res.redirect('/admin/viewUser')
                            } else {
                                res.render('addUser', { message: "SOmthing Wrong..." });
                            }
                        } else {
                            res.render('addUser', { message: "Password Is Note Strong" });
                        }
                    } else {
                        res.render('addUser', { message: " Mobile Number Should be 10 Degits " });
                    }

                } else {
                    res.render('addUser', { message: " User Already Exists" });
                }
            } else {
                res.render('addUser', { message: " Please Check Your Email Structure" });
            }
        } else {
            res.render('addUser', { message: " Invalid Name Provide" });
        }


    } catch (error) {
        console.log(error.message)

    }
}


const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    adminLogin,
    veryfyLogin,
    dashboard,
    chart,
    viewUser,
    blockUser,
    loadaddUser,
    addUser,
  
   
    adminLogout,
    // test,
    
   


    

   

}