const mongoose = require('mongoose')
const UserDb = require("../model/userModel");
const WishlistDB = require("../model/wishlist");
const CategoryDb = require("../model/categoryModel");
const OrderDB = require('../model/orderModel');
const CartDB = require('../model/cartModel');
const AddressDB = require('../model/addressModel');
const WalletDB = require('../model/walletModel');
const ProductDB = require('../model/productModel');
const bcrypt = require('bcrypt');



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

        const userData = await UserDb.find({is_admin: false,}).limit(limit * 1).sort({createdAt:-1})

        const count = await UserDb.find({
            is_admin: false
        }).countDocuments();


        res.render('usersList', {
            userData: userData,
            totalPage: Math.ceil(count / limit),
        })
    } catch (error) {
        console.log(error.message)

    }
}

const dashboard = async (req, res) => {
    try {

     
        const products = await ProductDB.find({orderCount:{$gt:0}}).sort({'orderCount':-1}).limit(10);
        const categorys = await CategoryDb.find({orderCount:{$gt:0}}).sort({'orderCount':-1}).limit(10);
        const orderData = await OrderDB.find({}).populate("products.productId");
        const today = new Date();
         return res.render('dashboard', { dbData: orderData, arrayCount: products, top10Category: categorys ,year:today.getFullYear(),sDate:today});
         
       
       
    } catch (error) {
        console.log(error.message)

    }
}

const changeDateDashboard = async(req,res)=>{
   try {

  
    const {eDate,sDate,select}  = req.query;
    let orderData;
    switch (select) {
        case "Year":
            if(!eDate || !sDate){
               return res.json({success:false,message:"Please Select Both Starting Year And Ending Year!."})
            }
            if(eDate < sDate){
                return res.json({success:false,message:`Invalid ${select} Period!.`})
            }
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${eDate}-12-31`)}},{createdAt:{$gte:new Date(`${sDate}-01-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
        case "Month":
            if(!sDate){
               return res.json({success:false,message:"Please Select A Year!."})
            }
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${sDate}-12-31`)}},{createdAt:{$gte:new Date(`${sDate}-01-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
    
        default:
            if(!eDate || !sDate){
               return res.json({success:false,message:"Please Select Both Starting Year And The Month!."})
            }
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${sDate}-${eDate}-31`)}},{createdAt:{$gte:new Date(`${sDate}-${eDate}-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
    }

} catch (error) {
    console.log(error.message);
   }
}

const filterDashboard = async(req,res)=>{
   try {

    const {select}  = req.query;
    const date = new Date()
    const  months =  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];               
    let orderData;
    switch (select) {
        case "Year":
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${date.getFullYear()}-12-31`)}},{createdAt:{$gte:new Date(`2020-01-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
        case "Month":
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${date.getFullYear()}-12-31`)}},{createdAt:{$gte:new Date(`${date.getFullYear()}-01-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
    
        default:
            orderData = await OrderDB.find({$and:[{createdAt:{$lte:new Date(`${date.getFullYear()}-${months[date.getMonth()]}-31`)}},{createdAt:{$gte:new Date(`${date.getFullYear()}-${months[date.getMonth()]}-01`)}}]}).populate("userId").populate({path:"products.productId",populate:{path:"categoryID"}})
            res.json({success:true,orderData})
            break;
    }

} catch (error) {
    console.log(error.message);
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
        const { userId } = req.body

        const data = await UserDb.findOne({ _id: userId });
        if(!data){
          return res.json({success:false,message:"User Not Found!."});
        }

        await UserDb.findByIdAndUpdate({_id:userId},{$set:{is_blocked:!data.is_blocked}});
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
          if(mobile.length >10 || mobile.length < 10){
           return  res.json({success:false,field:'mobile',message:"Mobile number mustbe 10 digits numbes!."});
          }
          if (password.length < 8 || password.length > 20) {
          return res.json({success:false,field:'password', message: "Password Should be in between 8 - 20" });
          }

           function generateRefferalCode(email,length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            const emi = email.split("@")[0]
            let couponId = `${emi}`
            for (let i = 0; i < length; i++) {
                couponId += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return couponId;
      }
            
      const reffaralCode = generateRefferalCode(email,4);
          
          const userData = new UserDb({
               name: name,
               email: email,
               password: password,
               mobile: mobile,
               reffaralCode,
             });
           await userData.save();

           const cart = new CartDB({
                 userId: userData._id,
                 products: [],
               });
            await cart.save();
           
            const wallet = new WalletDB({
                  userId: userData._id,
                  Balance: 0,
                  walletHistery: [],
                });
                
                await wallet.save();
                
                // creating 
               
                const wishlist = new WishlistDB({
                  userId: userData._id,
                  products: [],
                });
                await wishlist.save();
                
                // crete address
                const address = await AddressDB({
                    userID: userData._id,
                    address: [],
                  });
                  await address.save();
            
                const order = await OrderDB({
                    userId: userData._id,
                    products: [],
                  });
                
                 await order.save();
            

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
         res.json({users,totalPage:Math.ceil(count/limit)});
       
    } catch (error) {
        console.log(error.message);
    }
}
const userPagination = async (req, res) => {
    try {
        const { page,search,sort} = req.query;
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
    changeDateDashboard,
    filterDashboard,
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