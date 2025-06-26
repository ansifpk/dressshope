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
        const {password,email} = req.body;
        const userData = await UserDb.findOne({ email: email });

        if(!userData){
            return res.json({success:false,message: "You are not registered" })
        }
        const passwordMatch = await bcrypt.compare(password, userData.password)
        if(!passwordMatch){
            return res.json({success:false, message: "Incorrect Password" })
        }
        if(userData.is_admin == 0){
            return res.json({success:false, message: 'You Are Not Admin' })
        }
        req.session.admin_id = userData._id;
        return res.json({success:true,message:"Login Success!."})
        
        
    } catch (error) {
        console.log(error.message)

    }
}

const viewUser = async (req, res) => {
    try {

 
         
        const limit = 4;

        const userData = await UserDb.find({is_admin: false,}).limit(limit * 1)

        const count = await UserDb.find({
            is_admin: false
        }).countDocuments();


        res.render('usersList', {
            userData: userData,
            totalPages: Math.ceil(count / limit),
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

        const data = await UserDb.findOne({ _id: userId });
        if(!data){
          return res.json({success:false,message:"User Not Found!."});
        }

        data.is_blocked = !data.is_blocked;
        await data.save();
        res.json({success:true})

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
      
        const {email,password,name,mobile} = req.body;
      
        if(!/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(email)){
         return res.json({success:false,field:'email',message:"Invalid Email!."});
        }

        if(!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)){
          return  res.json({success:false,field:'name',message:"Invalid Name!."});
        }

          const emailCheck = await UserDb.findOne({ email: req.body.email });
          if(emailCheck){
            return res.json({success:false,field:'email',message:"Email Already Registerd!."});
          }
          if(mobile.length >10){
           return  res.json({success:false,field:'mobile',message:"Mobile number mustbe 10 digits numbes!."});
          }
          if (password.length < 8 || password.length > 20) {
          return res.json({success:false,field:'password', message: "Password Should be in between 8 - 20" });
          }
          
          const userData = new UserDb({
               name: name,
               email: email,
               password: password,
               mobile: mobile
             });
           await userData.save();
           res.json({success:true,message:"User created Successfully!."});
           return;

    } catch (error) {
        console.log(error.message)

    }
}


const sortUser = async (req, res) => {
    try {
       const {sort,search} = req.query;
       const limit = 4;
       let totelPage = 0;
       const query = {};

    switch (sort) {
        case "Email A - Z":
        query.email = 1;
        break;
        case "Email Z - A":
        query.email = -1;
        break;
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
   
       let users = await UserDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).sort(query)
       totelPage = Math.ceil(users.length/limit)
       users = users.slice(0,limit)
       return res.json({users,totelPage:totelPage});

    } catch (error) {
        console.log(error.message);
    }
}
const searchrUser = async (req, res) => {
    try {
        const {search} = req.query;
        const limit = 4;
        const count = await UserDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).countDocuments()
        const users = await UserDb.find({$or: [{ name: { $regex: ".*" + search + ".*", $options: "i" } }]}).limit(limit)
         res.json({users,totelPage:Math.ceil(count/limit)});
       
    } catch (error) {
        console.log(error.message);
    }
}
const userPagination = async (req, res) => {
    try {
        const { page,search,sort,} = req.query;
        const limit = 4;

        const query = {};

    switch (sort) {
        case "Email A - Z":
        query.email = 1;
        break;
        case "Email Z - A":
        query.email = -1;
        break;
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

       
        const users = await UserDb.find({ name: { $regex: ".*" + search + ".*", $options: "i" }}).skip((page*limit)-limit).limit(limit).sort(query)
        res.json({users});

       
    } catch (error) {
        console.log(error.message);
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
    sortUser,
    userPagination,
   searchrUser,
    adminLogout,
}