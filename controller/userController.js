
const mongoose =require("mongoose")
const User = require("../model/userModel");
const ProductDB = require("../model/productModel");
const UserOtpVerification = require("../model/userOtpVerification");
const AddressDB = require('../model/addressModel');
const CartDB = require('../model/cartModel');
const OrderDB = require('../model/orderModel');
const WishlistDB = require('../model/wishlist');
const CoupenDB = require('../model/cuppenModel');
const WalletDB = require('../model/walletModel');
const OfferDB = require("../model/offerModel");
const CategoryDb = require("../model/categoryModel");
const randomstring = require("randomstring")
const bcrypt= require('bcrypt');
const nodemailer = require('nodemailer');
const path = require('path');
const { access } = require("fs/promises");
const { Console, log } = require("console");
const razorPay = require('razorpay');
const easyinvoice = require('easyinvoice');
const fs = require("fs");
const pdf = require('html-pdf');
const ejs = require('ejs')

const instance = new razorPay({
    key_id: process.env.RAZOR_ID,
    key_secret: process.env.RAZOR_SECRET
});


const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const sendOTPverificationEmail = async({email},res)=>{
    try {
        
        let transporter = nodemailer.createTransport({
            service: 'gmail',
          
            auth: {
                user: 'pkansif39@gmail.com',
                pass: 'tvtq zgcc skhn rliu'
            }
        });

        otp = `${
            Math.floor(1000 + Math.random() * 9000)
        }`;

         // mail options
         const mailOptions = {
            from: 'pkansif39@gmail.com',
            to: 'pkansif39@gmail.com',
            subject: "Verify Your email",
            html: `Your OTP is: ${otp}`
        };

        // hash ottp
        const saltRounds = 10;
        console.log(otp)
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        
       const  newOtpVerifivation =  new UserOtpVerification({email:email,otp:hashedOTP});
       console.log(newOtpVerifivation)
       console.log(email)
       await newOtpVerifivation.save();
       
       await transporter.sendMail(mailOptions);

       res.redirect(`/otp?email=${email}`);

    } catch (error) {
        console.log(error.message);
    }
}

//########### google ##############

const failed = async(req,res)=>{
    try {
        res.send('failed');

    } catch (error) {
        console.log(error.message);
    }
}

const success = async(req,res)=>{
    try {
      
       const name=req.user.displayName;
       const email=req.user.emails[0].value;
       const googleId=req.user.id;
       
       const userData = await User.findOne({email:email});
       if(userData){
        req.session.user_id=userData._id;
        res.redirect('/home');
       }else{
        const user = new User({
            name:name,
            email:email,
            is_verified:true,
            is_admin:0,
            is_blocked:false,
            password:await securePassword(googleId)
        });
      const newUser =  await user.save();
      if(newUser){
         req.session.user_id=newUser._id;
         res.redirect('/home')
      }
       }
       
      

    } catch (error) {
        console.log(error.message);
    }
}

//########### login&register ##############
const login = async(req,res)=>{
    try {
        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}

const loadforgetPassword = async(req,res)=>{
    try {
        // if(req.session){
        //     req.session.destroy();
        //     res.render('forget')
        // }
        res.render('forget')
    } catch (error) {
        console.log(error.message);
    }
}



const veryfyForgetPassword = async(req,res)=>{
    try {
        
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
         if(userData.is_verified==true){
            const randomString = randomstring.generate();
            const updateData = await User.updateOne({email:email},{$set:{token:randomString}})
            sendResetPasswordMail(userData.name,userData.email,randomString);
            res.render('forget',{message:"Reset Password Link is Sent to Your Mail"});
         }else{
            res.render('forget',{message:"Please Verify Your Email"});
         }
        }else{
        res.render('forget',{message:"User Email Not Found"});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const sendResetPasswordMail = async(name,email,token)=>{
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
          
            auth: {
                user: 'pkansif39@gmail.com',
                pass: 'tvtq zgcc skhn rliu'
            }
        });

       

         // mail options
         const mailOptions = {
            from: 'pkansif39@gmail.com',
            to: 'pkansif39@gmail.com',
            subject: "Reset Your Password",
            html: `Hi ${name} Pease ClickHere To :<a href="http://localhost:3000/forgetPassword?token=${token}">Forget</a> your password`
        };
        await transporter.sendMail(mailOptions)
    }catch (error) {
        console.log(error.message);
    }
}

const loadnewPassword = async(req,res)=>{
    try {
        const token = req.query.token;
       const tokenData =  await User.findOne({token:token});
       if(tokenData){
        console.log(tokenData._id)
        res.render("newPassword",{user_id:tokenData._id});
       }else{
        res.render("newPassword",{message:"token is invalid"});
       }
       
    }catch(error){
        console.log(error.message);
    }
}

const veryfynewPassword = async(req,res)=>{
    try {
        
       const securepassword = await securePassword(req.body.password);
if(req.body.password.length>4){
    if(req.body.password==req.body.repassword){
        
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{password:securepassword,token:''}});
            await userData.save();
            res.redirect('/')
           }else{
            res.render('newPassword',{message:'confirm password not match'})
           }
}else{
    res.render('newPassword',{message:'Please Enter a Strong Password'})
}
    //    
       
    }catch(error){
        console.log(error.message);
    }
}

const register = async(req,res)=>{
    try {
        res.render("register")
    }catch(error){
        console.log(error.message);
    }
}

  
   const insertUser = async(req,res)=>{
    try {
        if(/^[A-Za-z]+(?:[A-Za-z]+)?$/.test(req.body.name)){
            if(/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)){
                const emailCheck = await User.findOne({email:req.body.email});
                if(!emailCheck){
                    const mobileLength = (req.body.mobile).length;
                    if(mobileLength==10){
                        const passLength = (req.body.password).length
                        if(passLength>4){
                          const data  =    req.session.user={
                                email:req.body.email,
                                name:req.body.name,
                                mobile:req.body.mobile,
                                password: await securePassword(req.body.password),
                                is_admin:0,
                                is_blocked:false,
                                is_verified:false,
                            }
                           
                             sendOTPverificationEmail(data, res,);
                            
                        }else{
                            res.render('register',{message:"Password Is Note Strong"});
                        }
                     
                    }else{
                        res.render('register',{message:'Mobile Number Should Be 10 Degit'})
                    }

                }else{
                    res.render('register',{message:'Email Already Exists'})
                }
            }else{
                res.render('register',{message:'Please Check Your Email Structure'})
            }

        }else{
            res.render('register',{message:'invalid name provide'})
        }
       
    } catch (error) {
        console.log(error.message);
    }
   }

   
   const loadOtp = async(req,res)=>{
    try {

        const email = req.query.email;
        const user = await UserOtpVerification.findOne({email:email});
     
        res.render("otp",{userData:user})
         
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp  =async(req,res)=>{
     try {
        const email=req.query.email;
        const otpp = req.body.num1 + req.body.num2 + req.body.num3 + req.body.num4;
       
        const userVerification = await UserOtpVerification.findOne({email:email});
      if(userVerification){
        const {otp:hashotp}=userVerification;
      
        const validOtp = await bcrypt.compare(otpp,hashotp)
     
       if(validOtp){

       const userData =  new User({
        email:req.session.user.email,
        name:req.session.user.name,
        mobile:req.session.user.mobile,
        password:req.session.user.password,
        is_admin:req.session.user.is_admin,
        is_blocked:req.session.user.is_blocked, 
        is_verified:req.session.user.is_verified,

       });
        const data = await userData.save();
       
        if(userData.is_verified==false){
           const user =  await User.findOne({email:req.query.email});
          console.log(user.is_blocked)
           if(user){
             await User.findByIdAndUpdate({
                _id:user._id
             },{$set:{is_verified:true}})
           }
        }
       res.redirect('/')
       }else{
       
         
      
         res.render("otp",{userData:userVerification,message:"wrong otp"})
         console.log("wrong otp")
       }
      }else{
        res.render("otp",{userData:userVerification,message:"time out"})
        console.log("time out")
      }
       

      
            
        
     } catch (error) {
        console.log(error.message);
     }
}

const resendOtp = async(req,res)=>{
    try {
      
       
       const {email}=req.query;
       

       const data = await UserOtpVerification.findOneAndDelete({email:email});
       
       sendOTPverificationEmail(data,res)
    } catch (error) {
        console.log(error.message);
    }
}

const veryfyLogin = async(req,res)=>{
    try {
       
       const  email=req.body.email;
       const  password=req.body.password
        const userData = await User.findOne({email:email});
        
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_blocked==false){
                    if(userData.is_verified==true){
                        req.session.user_id=userData._id;
                        res.redirect('/home')
                    }else{
                        res.render('login',{message:'you Are an Bloked User'})
                    
                    }

                   
                }else{
                    res.render('login',{message:'you Are an Bloked User'})
                }
              
            }else{
                res.render('login',{message:'Email or Password is incorrect'})
            }
            
        }else{
            res.render('login',{message:'User Not Found'})
        }
    } catch (error) {
        console.log(error.message);
    }
}


//########### products ##############

const loadHome = async(req,res)=>{
    try {
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id})
        const offerData = await OfferDB.find({})
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
           let cartTotal =0;
            if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
           
              return acc+value.productId.Price*value.quandity
            }
         },0)
        }
        res.render('home',{cartData,wishlistData,cartTotal})
    } catch (error) {
        console.log(error.message);
    }
}

const sort = async(req,res)=>{
    try {
        console.log(req.params.id);
        console.log("sort");
    } catch (error) {
        console.log(error.message);
    }
}


const loadProducts = async(req,res)=>{
    try {
        const id = req.query.sort
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        const productData = await ProductDB.find({is_listed:true}).populate('categoryID');
        const  rate = offerData.offerRate/100;
         let cartTotal=0;
         if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
           const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
           if(offer){
             return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
           }else{
          
             return acc+value.productId.Price*value.quandity
           }
        },0)
    }
       

        var search='';
        if(req.query.search){
            search=req.query.search
        }
        let sort;
        if (id === "Defult Sort") {
            console.log('1')
            const productData = await ProductDB.find({is_listed:true}).populate('categoryID')
            res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
        } else if (id === "Sort by Price: low to high") {
            console.log('2')
            sort = { Price: 1 };
            const productData = await ProductDB.find({is_listed:true}).populate('categoryID').lean().sort(sort).exec()
            productData.sort((a,b)=>a.Price-b.Price)
            res.render('products',{productData:productData,wishlistData,offerData,rate,cartData,cartTotal});
        } else if (id === "Sort by Price: high to low") {
            console.log('3')
            sort = { Price: -1 };
            const productData = await ProductDB.find({is_listed:true}).populate('categoryID').lean().sort(sort).exec()
            productData.sort((a,b)=>b.Price-a.Price)
            res.render('products',{productData:productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else if (id === "Sort by Name : A-Z") {
        console.log('4')
           sort = { name: 1 };
           const productData = await ProductDB.find({is_listed:true}).populate('categoryID').lean().sort(sort)
           res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else if (id === "Sort by Name : Z-A") {
        console.log('5')
           sort = { name: -1 };
           const productData = await ProductDB.find({is_listed:true}).populate('categoryID').lean().sort(sort)
           res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
       } else {
        console.log('6')
        const productData = await ProductDB.find({is_listed:true}).populate('categoryID')
        res.render('products',{productData,wishlistData,offerData,rate,cartData,cartTotal});
        }
         
         
      
         
       
    } catch (error) {
        console.log(error.message);
    }
};


const wcollection = async(req,res)=>{
    try {
        let sort;
        const id = req.query.sort;
        console.log(id)
        let search="";
       if(req.query.search){
        search=req.query.search
       }
       
       const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
        path: 'products.productId',
        populate: { path: 'categoryID' }})
    const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
    const offerData = await OfferDB.find({});
     let cartTotal=0;
     if(cartData){
     cartTotal = cartData.products.reduce((acc,value)=>{value
       const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
       if(offer){
         return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
       }else{
      
         return acc+value.productId.Price*value.quandity
       }
    },0)
}

        if (id === "Defult Sort") {
            console.log("1")
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID").lean().sort(sort);
            res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
        } else if (id === "Sort by Price: low to high") {
            console.log("2")
            sort = { Price: 1 };
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID").lean().sort(sort).exec();
            productData.sort((a,b)=>a.Price-b.Price)
            res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
        } else if (id === "Sort by Price: high to low") {
            console.log("3")
            sort = { Price: -1 };
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID").lean().sort(sort)
            .exec();
            productData.sort((a,b)=>b.Price-a.Price)
            res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
       } else if (id === "Sort by Name : A-Z") {
        console.log("4")
           sort = { name: 1 };
         
           const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
           ]}).populate("categoryID").lean().sort(sort);
           res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
       } else if (id === "Sort by Name : Z-A") {
           sort = { name: -1 };
           console.log("5")
           const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
           ]}).populate("categoryID").lean().sort(sort);
           res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
       } else {
       
        const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
        ]}).populate("categoryID");
       
        res.render('wcollection',{productData:productData,wishlistData,offerData,cartTotal,cartData});
        }
       

    } catch (error) {
        console.log(error.message);
    }
}


const mcollection = async(req,res)=>{
    try {

        let sort;
        const id = req.query.sort;
        let search="";
       if(req.query.search){
        search=req.query.search
       }

       const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
        path: 'products.productId',
        populate: { path: 'categoryID' }})
    const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
    const offerData = await OfferDB.find({});
     let cartTotal=0;
     if(cartData){
     cartTotal = cartData.products.reduce((acc,value)=>{value
       const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
       if(offer){
         return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
       }else{
      
         return acc+value.productId.Price*value.quandity
       }
    },0)
}

        if (id === "Defult Sort") {
            console.log("1")
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID")
            res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
        } else if (id === "Sort by Price: low to high") {
            console.log("2")
            sort = { Price: 1 };
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID").lean().sort(sort).exec();
            productData.sort((a,b)=>a.Price-b.Price)
            res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
        } else if (id === "Sort by Price: high to low") {
            console.log("3")
            sort = { Price: -1 };
            const productData = await ProductDB.find({is_listed:true,$or:[
                {name:{$regex:'.*'+search+'.*',$options:'i'}},
                {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
            ]}).populate("categoryID").lean().sort(sort).exec();
            productData.sort((a,b)=>b.Price-a.Price)
            res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
       } else if (id === "Sort by Name : A-Z") {
        console.log("4")
           sort = { name: 1 };
           const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
           ]}).populate("categoryID").lean().sort(sort);
           res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
       } else if (id === "Sort by Name : Z-A") {
        console.log("5")
           sort = { name: -1 };
           const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
           ]}).populate("categoryID").lean().sort(sort);
           res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
       } else {
        const productData = await ProductDB.find({is_listed:true,$or:[
            {name:{$regex:'.*'+search+'.*',$options:'i'}},
            {"categoryID.name":{$regex:'.*'+search+'.*',$options:"i"}}
        ]}).populate("categoryID");

        res.render('mcollection',{productData:productData,cartData,wishlistData,offerData,cartTotal});
        }

    } catch (error) {
        console.log(error.message);
    }
}


const productsDetailes = async(req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        const productData = await ProductDB.findById({_id:req.query.id}).populate('categoryID');
       let cartTotal=0;
        if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
             },0)
        }
        res.render('detailes',{productData,offerData,cartData,cartTotal,wishlistData})
    } catch (error) {
        console.log(error.message);
    }
}


const errorpage = async (req,res)=>{
    try {
       res.render('error')
    } catch (error) {
        console.log(error.message);
    }
}
//########### profile ##############

const profile = async (req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
         cartTotal = cartData?.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
         },0)
        }
       const userData = await User.findById({_id:req.session.user_id})
       res.render('profile',{user:userData,cartData,wishlistData,cartTotal});
    } catch (error) {
        console.log(error.message);
    }
}


const loadedit = async (req,res)=>{
    try {
       
       const userData = await User.findById({_id:req.query.id});
       
       res.render('edit',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}


const updateProfile = async (req,res)=>{
    try {
       
      const data =await User.findOne({_id:req.query.id});
      const emailCheck = await User.findOne({email:req.body.email});
      if(!emailCheck){
        if(/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)){
        if((req.body.mobile).length==10){
            const userData = await User.findByIdAndUpdate({_id:req.query.id},{name:req.body.name,email:req.body.email,mobile:req.body.mobile});
       
            await userData.save()
            res.redirect('/profile');
    
        }else{
            const userData = await User.findById({_id:req.query.id});
            res.render('edit',{user:userData,message:'mobile numbe shouldbe 10 digit'});
        }
    }else{
        const userData = await User.findById({_id:req.query.id});
        res.render('edit',{user:userData,message:'Please Check The Structure Of your Email'});
    }
      }else if(data.email==req.body.email){
        if(/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)){
            if((req.body.mobile).length==10){
                const userData = await User.findByIdAndUpdate({_id:req.query.id},{name:req.body.name,email:req.body.email,mobile:req.body.mobile});
           
                await userData.save()
                res.redirect('/profile');
        
            }else{
                const userData = await User.findById({_id:req.query.id});
                res.render('edit',{user:userData,message:'mobile numbe shouldbe 10 digit'});
            }
        }else{
            const userData = await User.findById({_id:req.query.id});
            res.render('edit',{user:userData,message:'Please Check The Structure Of your Email'});
        }
      }else{

        const userData = await User.findById({_id:req.query.id});
        res.render('edit',{user:userData,message:'user already exists'});

      }
       
    } catch (error) {
        console.log(error.message);
    }
}


const userLogout = async (req,res)=>{
    try {
        
        req.session.destroy();
        
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}


const addAddress = async (req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
         },0)
        }
       res.render('addAddress',{cartData,wishlistData,cartTotal,});
    } catch (error) {
        console.log(error.message);
    }
};


const saveAddress = async (req,res)=>{
    try {
         
       const exists =  await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
        if(!exists){
            const address = await AddressDB({
                userID:req.session.user_id,
                address:[{
                    fname:req.body.fname,
                    lname:req.body.lname,
                    country:req.body.country,
                    address:req.body.address,
                    city:req.body.city,
                    state:req.body.state,
                    pincode:req.body.pincode,
                    mobile:req.body.mobile,
                    email:req.body.email
                }]
            })
             
          await address.save();
           
           res.redirect('/Addresses')
        }else{
            
            const checkAddress = exists.address.find((a) => {
                return a.address === req.body.address;
            });
          
            if(checkAddress){
                const fname = checkAddress.fname
                const lname = checkAddress.lname
                
            if(fname==req.body.fname&&lname==req.body.lname){
              
                res.render('addAddress',{message:'This Address Already Exists'});
               
                
               
            }else{
                const data = await AddressDB.findOneAndUpdate({userID:req.session.user_id},{$push:{address:{
                                        fname:req.body.fname,
                                        lname:req.body.lname,
                                        country:req.body.country,
                                        address:req.body.address,
                                        city:req.body.city,
                                        state:req.body.state,
                                        pincode:req.body.pincode,
                                        mobile:req.body.mobile,
                                        email:req.body.email
                                    }}});
                                    res.redirect('/Addresses')
            }
        }else{
            const data = await AddressDB.findOneAndUpdate({userID:req.session.user_id},{$push:{address:{
                                    fname:req.body.fname,
                                    lname:req.body.lname,
                                    country:req.body.country,
                                    address:req.body.address,
                                    city:req.body.city,
                                    state:req.body.state,
                                    pincode:req.body.pincode,
                                    mobile:req.body.mobile,
                                    email:req.body.email
                                }}});
                                res.redirect('/Addresses')
        }
   
            
        }
     
    } catch (error) {
        console.log(error.message);
    }
};


const loadAddress = async (req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
         },0)
        }
        let page;
       if(req.query.page){
        page=req.query.page;
       }
       const limit= 2;
       const data = await AddressDB.findOne({userID:req.session.user_id}).populate('userID').limit(limit*1).skip((page -1)*limit).exec();
       const count = await AddressDB.findOne({userID:req.session.user_id}).populate('userID').countDocuments()
       
       res.render('address',{
        addressData:data,
        totalPages:Math.ceil(count/limit),
        currentPage:page,
        cartData,
        wishlistData,
        offerData,
        cartTotal
    });
      
    } catch (error) {
        console.log(error.message);
    }
}


const loadeditAddress = async (req,res)=>{
    try {
        
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
        const offerData = await OfferDB.find({});
        let cartTotal=0;
        if(cartData){
         cartTotal = cartData.products.reduce((acc,value)=>{value
            const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
            if(offer){
              return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
            }else{
              return acc+value.productId.Price*value.quandity
            }
         },0)
        }
        const data = await AddressDB.findOne({'address._id':req.query.id});
    
           const productUpdate = data.address.find((a)=>{
            return a._id.equals(req.query.id)
    })
   
        res.render('editAddress',{addressData:productUpdate,cartData,wishlistData,cartTotal});
      
    } catch (error) {
        console.log(error.message);
    }
}


const veryfyAddress = async (req,res)=>{
    try {
        
console.log(req.body.fname)
        const data = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
        
        const address = data.address.find((a)=>{
           return a._id.equals(req.query.id)
        });
         address.fname=req.body.fname;
         address.lname=req.body.lname;
         address.address=req.body.address;
         address.country=req.body.country;
         address.state=req.body.state;
         address.city=req.body.city;
         address.pincode=req.body.pincode;
         address.email=req.body.email;
         address.mobile=req.body.mobile;
        const x = await  data.save();

      res.redirect("/addresses")
      
    } catch (error) {
        console.log(error.message);
    }
}

const removeAddress = async (req,res)=>{
    try {
        const {id}=req.query;
        console.log("hiii")
        console.log(id);
        const data = await AddressDB.findOneAndUpdate({userID:req.session.user_id},{$pull:{address:{_id:id}}});
        console.log(data)
    } catch (error) {
        console.log(error.message);
    }
}
//############ cart ####################
const addToCart = async (req,res)=>{
    try {
        const {productId,quandity}=req.query;
    
    if(!quandity){
        
          
          const userData =  await CartDB.findOne({userId:req.session.user_id});
          
   if(!userData){
         const product = await ProductDB.findById({_id:productId}).populate('categoryID');
         const productName = product.name;
         const cart =  new CartDB({
          userId:req.session.user_id,
          products:[{
            productId:product._id,    
            quandity:1,          
          }],       
         });
         const newCart =  await cart.save();
      
    }else{
        console.log("cart kk add akkanam");        
        const product = await ProductDB.findById({_id:productId}).populate('categoryID');
       
       
        const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
              const existsProduct=data.products.find((p)=>{
                return p.productId._id.equals(product._id)
              });
            
        if(!existsProduct){          
           
             await CartDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                productId:product._id,
                quandity:1,         
            }}}).populate('userId').populate('products.productId')
              
        }else{
           
           console.log('product alredy exists')
       
        }
    }
    }else{
      
        const userData =  await CartDB.findOne({userId:req.session.user_id});
        if(!userData){
            
            const product = await ProductDB.findById({_id:productId});
            const Quanndity = parseInt(quandity)
            const cart =  new CartDB({
                userId:req.session.user_id,
                products:[{
                    productId:product._id,
                    quandity:Quanndity,                               
                }],             
              });
              
              await cart.save();
    
    
        }else{
        
       
           const Quandity = parseInt(quandity);
        
           const product = await ProductDB.findById({_id:productId}).populate('categoryID');
       
       
        const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
              const existsProduct=data.products.find((p)=>{
                return p.productId._id.equals(product._id)
              });
        if(!existsProduct){
            const neww = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                productId:product._id,
                quandity:Quandity,
            }}}).populate('userId').populate('products.productId')
        }else{
           
           console.log('exists')
       
    }
    }
       }
  
      
    } catch (error) {
        console.log(error.message);
    }
}



const loadCartt = async (req,res)=>{
    try {
         console.log("refresh")
        const offerData = await OfferDB.find({});
        const user = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }
        });
            const wishlistData = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId')
       
        let subTotal=0;
        if(user){
            subTotal = user.products.reduce((acc,productsId)=>{
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
        console.log(user)
        res.render('cart',{productData:user,offerData:offerData,subTotal:subTotal,wishlistData});
       
    } catch (error) {
        console.log(error.message);
    }
}
const updateCart = async (req,res)=>{
        try {       
          const {productId,productPrice,quandity} = req.query;
          const offerData = await OfferDB.find({});
          
        //   const cart =  await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
          const cart = await CartDB.findOne({ userId: req.session.user_id })
    .populate('userId')
    .populate({
        path: 'products.productId',
        populate: { path: 'categoryID' } // Populate the categoryID field of the products
    });
        const productUpdate = cart.products.find((p)=>{
                  return p.productId.equals(productId)
          });
          
        
          const q = parseInt(quandity)
          productUpdate.quandity = q;
          
         let b =  await cart.save();
       
              let total =  b.products.reduce((acc,value)=>{
                return acc+value.productId.Price*value.quandity
                 
               },0);
          

           const offer = offerData.find(value => value && (value.iteam === productUpdate.productId.name || value.iteam === productUpdate.productId.categoryID.name));
          
          if(offer){
           const subTotal = total- Math.round(productUpdate.productId.Price*offer.offerRate/100)*q
           const productTotal = (productUpdate.productId.Price - Math.round(productUpdate.productId.Price*offer.offerRate/100))*q
           res.status(200).json({ total: subTotal , productTotal:productTotal });

          }else{
           

            let subTotal =  b.products.reduce((acc,valuee)=>{
                const offer = offerData.find(value => value && (value.iteam === valuee.productId.name || value.iteam === valuee.productId.categoryID.name));
                var amount=0;
                if(offer){
                    amount = Math.round(valuee.productId.Price*offer.offerRate/100)*valuee.quandity
                }
                 return acc+valuee.productId.Price*valuee.quandity-amount   
               },0);
           
           const productTotal = productUpdate.productId.Price*q
       
           res.status(200).json({  productTotal:productTotal , total: subTotal });

          }
      
        } catch (error) {
            console.log(error.message);
        }
    }
const deleteCart = async (req,res)=>{
    try {       
      const {productId} = req.query ;
       const offerData = await OfferDB.find({})
       const neww = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{'products':{productId:productId}}}).populate('userId').populate('products.productId')
     
       const cart = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
       if(cart.products.length>0){
        const newprice = cart.products.reduce((acc,product)=>{
            const offer = offerData.find(value => value && (value.iteam === product.productId.name || value.iteam === product.productId.categoryID.name));
            var amount=0;
            if(offer){
                
                 amount = Math.round(product.productId.Price*offer.offerRate/100)*product.quandity;
                 
            }
           return acc+product.productId.Price*product.quandity-amount
           
        },0);
        res.status(200).json({subTotal:newprice});
    }else{

           res.status(200).json({subTotal:0});
           await CartDB.findOneAndDelete({userId:req.session.user_id})

       }
      
    } catch (error) {
        console.log(error.message);
    }
}

//############### checkout ############
const checkOut = async (req,res)=>{
    try {
       const {coupen} = req.query
       const offerData = await OfferDB.find({});
       if(coupen){
        var a;
        
          const coupenData = await CoupenDB.findOne({coupenId:coupen});
          if(coupenData){
            const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')     
            const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
             if(data){
                const subTotal = data.products.reduce((acc,product)=>{
                    const offer = offerData.find(value => value && (value.iteam === product.productId.name || value.iteam === product.productId.categoryID.name));
                    var amount=0;
                    if(offer){  
                      return  amount = acc+product.productId.Price*product.quandity-   Math.round(product.productId.Price*offer.offerRate/100)*product.quandity;
                    }
                       
                        return amount = acc+product.productId.Price*product.quandity 
                    
                },0);
                
               
             const offer  =  Math.round(subTotal*coupenData.offer/100); 
            
              res.render('checkout',{ productData:data , addressData:address , offer:offer , coupen:coupen , offerData:offerData , subTotal:subTotal});
              
              }else{
                    res.redirect('/products')
               
                  }
          }else{
            console.log("no cupen found")
            const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
      
      const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
       if(data){
         let offer;
        res.render('checkout',{ productData:data , addressData:address , offer:offer, coupen:coupen  });
       }else{
        res.redirect('/products')
       }
          }
         
       }else{
        
       const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
      
      const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
       if(data){
         let offer;

         const subTotal = data.products.reduce((acc,product)=>{
            const offer = offerData.find(value => value && (value.iteam === product.productId.name || value.iteam === product.productId.categoryID.name));
            var amount=0;
            if(offer){  
                return  amount = acc+product.productId.Price*product.quandity-   Math.round(product.productId.Price*offer.offerRate/100)*product.quandity;
                
            }
            return amount = acc+product.productId.Price*product.quandity 
        },0);
         
        res.render('checkout',{ productData:data , addressData:address ,  offerData:offerData , subTotal:subTotal , offer:offer,coupen:coupen});
     
    }else{
        res.redirect('/products')
       }
    }
       
    } catch (error) {
        console.log(error.message);
    }
}

const changeAddress = async (req,res)=>{
    try {
           const check = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
           
           if(!check){
        
            const data = new AddressDB({
                userID:req.session.user_id,
                address:[{
                    fname:req.body.fname,
                    lname:req.body.lname,
                    country:req.body.country,
                    address:req.body.address,
                    city:req.body.city,
                    state:req.body.state,
                    pincode:req.body.pincode,
                    mobile:req.body.mobile,
                    email:req.body.email
                }]
            });
            await data.save();
             const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
             const cart = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
            
             res.render('checkout',{productData:cart,addressData:address});
           }else{
            console.log("address ind")
            const changeAddress = await AddressDB.findOneAndUpdate({userID:req.session.user_id},{$push:{address:{
                fname:req.body.fname,
                lname:req.body.lname,
                country:req.body.country,
                address:req.body.address,
                city:req.body.city,
                state:req.body.state,
                pincode:req.body.pincode,
                mobile:req.body.mobile,
                email:req.body.email
            }}});
             const x = await changeAddress.save();
             const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
             const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
            
             res.render('checkout',{productData:data,addressData:address});
           }
       
    } catch (error) {
        console.log(error.message);
    }
}

const order = async (req,res)=>{
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
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId')  
        res.render('order',{orderData:data,cartData,wishlistData,cartTotal})
    } catch (error) {
        console.log(error.message);
    }
}


const placeOrder = async (req,res)=>{
    try {
        const {addressId,paymentMethod,coupen} = req.query
        const offerData = await OfferDB.find({});
        console.log("address");
       
        if(paymentMethod=="Razor pay"){
            console.log(coupen)
            if(coupen!=='undefined'){
                console.log("coupen vech");
                
                const userData= await User.findOne({userId:req.session.user_id})
                if(addressId){
                    const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                    const userData = await User.findOne({userId: req.session.user_Id});
        
                    const coupenId = await CoupenDB.findOne({coupenId:coupen})
                    const money = cartData.products.reduce((acc,value)=>{
                                       
                        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                        if(offerProduct){
                            return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                        }else{
                            return acc+parseInt(value.productId.Price)*value.quandity
                        }
                        
                    },0);
                    console.log(money)
                    let coupenmoney = 0;
                    if(coupenId){
                        coupenmoney =  money - Math.round(money*coupenId.offer/100)
                    }else{
                        coupenmoney = money
                    }
                    console.log('coupenmoney',coupenmoney)
                    const amount =coupenmoney*100;
                    
                    const options = {
                        amount: amount,
                        currency: 'INR',
                        receipt: 'pkansif39@gmail.com'
                    }
                    instance.orders.create(options, 
                        (err, order)=>{
                            if(!err){
                                console.log(order)
                                res.send({
                                    success:true,
                                    msg:'Order Created',
                                    order_id:order.id,
                                    amount:amount,
                                    key_id:process.env.RAZOR_ID,
                                    // product_name:req.body.name,
                                    // description:req.body.description,
                                    contact:"7994566779",
                                    name:userData.name,
                                    email: "pkansif39@gmail.com",
                                    addressId:addressId,
                                    coupenId:coupen,
                                    paymentMethod:paymentMethod,
                                });

                            }else{
                                console.error("Error creating order:", err);
        
                                res.send({success:false,msg:'Something went wrong!'});
                            }
                        }
                    );
                    


                }else{
                    const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                    if(data){
                       console.log("2")
                       res.send({addAddress:true})
                       console.log("2")
                    }else{
                       console.log("3")
                       console.log("product illaa");
                    }
                }
            }else{
                console.log("coupen illadhe");
                const userData = await User.findOne({userId:req.session.user_id});
             
                    if(addressId){
                        console.log("razor");
                     
                        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('products.productId');;
                                    const userData = await User.findOne({userId: req.session.user_Id})
                                    const money = cartData.products.reduce((acc,value)=>{
                                       
                                        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                                        if(offerProduct){
                                            return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                                        }else{
                                            return acc+parseInt(value.productId.Price)*value.quandity
                                        }
                                        
                                    },0);
                                    
                                    const amount =money*100;
                                    const options = {
                                        amount: amount,
                                        currency: 'INR',
                                        receipt: 'pkansif39@gmail.com'
                                    }
                                    instance.orders.create(options, 
                                        (err, order)=>{
                                            if(!err){
                                               
                                                res.send({
                                                    success:true,
                                                    msg:'Order Created',
                                                    order_id:order.id,
                                                    amount:amount,
                                                    key_id:process.env.RAZOR_ID,
                                                    // product_name:req.body.name,
                                                    // description:req.body.description,
                                                    contact:"7994566779",
                                                    name:userData.name,
                                                    email: "pkansif39@gmail.com",
                                                    addressId:addressId,
                                                    coupenId:coupen,
                                                    paymentMethod:paymentMethod,
                                                });
                                                
            
                                            }else{
                                                console.log(err)
                                                console.error("Error creating order:", err);
                        
                                                res.send({success:false,msg:'Something went wrong!'});
                                            }
                                        }
                                    );
            
            
                       }else{
                        const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                         if(data){
                            console.log("2")
                            res.send({addAddress:true})
                            console.log("2")
                         }else{
                            console.log("3")
                            console.log("product illaa");
                         }
                       }
                
               
            }
           
        
        
         
        }else{
              console.log(" cod ss")
              if(coupen){
               const coupenId = await CoupenDB.findOne({coupenId:coupen});
                    if(addressId){
                            const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
       
                            const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
                             const address =  addressdb.address.find((a)=>{
                                return a.equals(addressId)
                           });

                           const  date =  new Date().toISOString().slice(0,10);
                           console.log(date)
                           let productsData = products.products;
                       
                           for(let i=0;i<productsData.length;i++){
                            let product = await ProductDB.findOne({_id:productsData[i].productId._id});
                            console.log("start");
                            
                            if(productsData[i].productId.stock>0){
                    
                                product.stock=product.stock-productsData[i].quandity;
                                 await product.save();
                            
                                 const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

                                 if(!exist){
                                   console.log('ivade')
                                    const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                    var amount = 0;
                                    var newPrice=0;
                                    const offer = coupenId.offer/100;
                                     
                                    if(offerProduct){         
                                      
                                        amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                        newPrice = amount -  Math.round(amount*offer)

                                    }else{
                                        newPrice = productsData[i].productId.Price*productsData[i].quandity
                                           
                                    }
                                       console.log(date)
                                        const data = new OrderDB({
                                            userId:req.session.user_id,
                                            products:[{
                                                productId:productsData[i].productId._id,
                                                productStatus:"pending",
                                                paymentStatus:"Not paid",
                                                quandity:productsData[i].quandity,
                                                orderDate:date,
                                                paymentMethod:paymentMethod,
                                                deliveryAddress:address,
            
                                                productTotal:newPrice
                                            }],
                                           
                                           });
                                      
                                           await data.save();

                               
                                 
                                       await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                    
                                       await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                                   
                                }else{
                                    console.log("00 products kk add akkanam");
                                    const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                    var amount = 0;
                                    var newPrice=0;
                                    const offer = coupenId.offer/100;

                                    if(offerProduct){         
                                      
                                        amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                        newPrice = amount -  Math.round(amount*offer)

                                    }else{
                                        newPrice = productsData[i].productId.Price*productsData[i].quandity
                                           
                                    }
                                     
                                      await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                                        productId:productsData[i].productId,
                                        productStatus:"pending",
                                        paymentStatus:"Not paid",
                                        quandity:productsData[i].quandity,
                                        orderDate:date,
                                        paymentMethod:paymentMethod,
                                        deliveryAddress:address,
                                        productTotal:newPrice
                                    }}}).populate('products.productId');

                                   
                                    await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                   
                                  
                                 };
                  
                            }else{
                                console.log("false");
                                res.send({outofstock:true , product:product.name})
                            }
                            
                          
                           };
                       
                     
                    }else{
                        console.log("1")

                         const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                          if(data){
                               console.log("2")
                                res.send({addAddress:true})
                               console.log("2")
                          }else{
                               console.log("3")
                               console.log("product illaa");
                          }
           
                    }
             
        
               
              }else{
              
                console.log("normal pay");
                if(addressId){
                      

                        const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
                     
                        const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
                         const address =  addressdb.address.find((a)=>{
                            return a.equals(addressId)
                       })
                       const  date =  new Date().toISOString().slice(0,10);
                       console.log(date)
                       let productsData = products.products;
                   
                       for(let i=0;i<productsData.length;i++){
                        let product = await ProductDB.findOne({_id:productsData[i].productId._id});
                        console.log("start");
                
                        if(productsData[i].productId.stock>0){
                
                            product.stock=product.stock-productsData[i].quandity;
                             await product.save();
                        
                             const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');
                             if(!exist){
                                const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                var amount = 0;
                                if(offerProduct){                      
                                    amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                                }else{
                                      amount = productsData[i].productId.Price*productsData[i].quandity
                                  }
                        
                                  console.log("2",date)
                            const data = new OrderDB({
                                userId:req.session.user_id,
                                products:[{
                                    productId:productsData[i].productId._id,
                                    productStatus:"pending",
                                    paymentStatus:"Not paid",
                                    quandity:productsData[i].quandity,
                                    orderDate:date,
                                    paymentMethod:paymentMethod,
                                    deliveryAddress:address,

                                    productTotal:amount
                                }],
                               
                               });
                           
                               await data.save();

                           
                                await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                                console.log("success");
                            }else{
                                console.log(" products kk add akkanam");
                                const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                                var amount = 0;
                                if(offerProduct){                      
                                  amount =productsData[i].productId.Price*productsData[i].quandity -  Math.round(productsData[i].productId.Price*offerProduct.offerRate/100)*productsData[i].quandity
                              }else{
                                    amount = productsData[i].productId.Price*productsData[i].quandity
                                }
                                await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                                    productId:productsData[i].productId,
                                    productStatus:"pending",
                                    paymentStatus:"Not paid",
                                    quandity:productsData[i].quandity,
                                    orderDate:date,
                                    paymentMethod:paymentMethod,
                                    deliveryAddress:address,
                                    productTotal:amount
                                }}}).populate('products.productId');
                               
                          
                                await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                               
                             }
                           
                        }else{
                            console.log("false");
                            res.send({outofstock:true , product:product.name})
                        }
                        
                      
                       };
                   
                  
                        } else{
                            console.log("1")
                            const address = await AddressDB.findOne({userID:req.session.user_id}).populate('userID')
                      
                            const data = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
                             if(data){
                                console.log("2")
                                res.send({addAddress:true})
                                console.log("2")
                             }else{
                                console.log("3")
                                console.log("product illaa");
                             }
                           
                        }
              }
    
    }
        
    } catch (error) {
        console.log(error.message);
    }
}


const orderDetailes = async (req,res)=>{
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
        const {id} = req.query  
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId')
        
        const product =  data.products.find((p)=>{
            return p._id.equals(id)
        });
       
   
      
       res.render('orderDetailes',{ orderData:product, userData:data,cartData,wishlistData,cartTotal})
       
    } catch (error) {
        console.log(error.message);
    }
}


const cancelOrder = async (req,res)=>{
    try {
    
        const {id} = req.query;
        const orderData =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');
          
        const a = orderData.products.find((p)=>{
            return p._id.equals(id)
        });
                
       a.productStatus="canceled" 
        await orderData.save();
        const data =  await OrderDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId');;
                  
        let totalPriceOfPendingProducts = 0;

         for (let i = 0; i < data.products.length; i++) {
              if (data.products[i].productStatus === "pending") {
                    totalPriceOfPendingProducts += data.products[i].totalPrice;
                }
            }

         data.total=totalPriceOfPendingProducts
         await data.save();
           
    } catch (error) {
        console.log(error.message);
    }
}


const returnOrder = async (req,res)=>{
    try {      
       const {productId,value} = req.query;
       const productData = await OrderDB.findOne({userId:req.session.user_id}).populate({
        path: 'products.productId',
        populate: { path: 'categoryID' }
    });

       const product = productData.products.find((p)=>{
         return  p._id.equals(productId);     
       });
           
       product.productStatus = "return";
      
       const pro = await ProductDB.findOne({_id:product.productId._id}).populate("categoryID");
       
       pro.orderCount--;
       pro.stock = pro.stock+product.quandity
       await pro.save();
      
      
       const categoty = await CategoryDb.findOne({_id:pro.categoryID});
      
       categoty.orderCount--;
       await categoty.save();
                              
       product.cancellationReason = value;

       await  productData.save();
       
       const walletData = await WalletDB.findOne({userId:req.session.user_id});
       const offerData = await OfferDB.find({});
       const offer = offerData.find((value)=> value.iteam == pro.name || value.iteam == pro.categoryID.name)
       let amount =0;
       if(offer){
        amount = product.productId.Price*product.quandity   - Math.round(product.productId.Price*offer.offerRate/100)*product.quandity
       }else{
        amount =product.productId.Price*product.quandity;
       }

    // if(!walletData){
    //    const data = new WalletDB({
    //     userId:req.session.user_id,
    //     Balance:amount,
    //     walletHistery:[`Credit : ${product.productId.name} refunded amount of Rs.${product.productId.Price*product.quandity}.00`]
    //    });
      
    //    await data.save()
   
    // }else{
    //     const data = await WalletDB.findOne({userId:req.session.user_id});
    //     const total = data.Balance +=amount;
        
    //    await WalletDB.findOneAndUpdate({userId:req.session.user_id},{$set:{Balance:total}})
    //    await WalletDB.findOneAndUpdate({userId:req.session.user_id},{$push:{walletHistery:`Credit : ${product.productId.name} refunded amount of Rs.${amount}.00`}})
    // }
      
    } catch (error) {
        console.log(error.message);
    }
}

// ############## wallet ################

const wallet = async (req,res)=>{
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
       const walletData = await WalletDB.findOne({userId:req.session.user_id})
       res.render("wallet",{walletData:walletData,cartData,wishlistData,cartTotal});

    } catch (error) {
        console.log(error.message);
    }
}
//#### wishlist ######

const test = async( req,res)=>{
    try {
        const {productId } = req.query
        const orderData = await OrderDB.findOne({userId:req.session.user_id}).populate("userId").populate('products.productId');
        const product = orderData.products.find((p)=>{
           return p._id.equals(productId)
        });
        const  date =  new Date().toISOString().slice(0,10);
      
      
const data = {
    apiKey: "free", // Please register to receive a production apiKey: https://app.budgetinvoice.com/register
    mode: "development", // Production or development, defaults to production   
    images: {
        // The logo on top of your invoice
        logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
        // The invoice background
        // background: "https://public.budgetinvoice.com/img/watermark-draft.jpg"
    },
    // Your own data
    sender: {
        company: "Molla",
        address: "MG Street",
        zip: "560001",
        city: "Bangaloru",
        country: "INDIA"
       
    },
    // Your recipient
    client: {
        company: orderData.userId.name,
        address:product.deliveryAddress.address,
        zip: product.deliveryAddress.pincode,
        city:product.deliveryAddress.city,
        country: product.deliveryAddress.country
      
    },
    information: {
        // Invoice data
        date:date
        // Invoice due date
        // dueDate: "31-12-2021"
    },
    // The products you would like to see on your invoice
    // Total values are being calculated automatically
    products: [
        {
            quantity: product.quandity,
            description:product.productId.name,
            // taxRate: 6,
            price:product.productTotal*product.quandity,
        }
    ],
    // Settings to customize your invoice
    settings: {
        currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        // locale: "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
        // marginTop: 25, // Defaults to '25'
        // marginRight: 25, // Defaults to '25'
        // marginLeft: 25, // Defaults to '25'
        // marginBottom: 25, // Defaults to '25'
        // format: "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
        // height: "1000px", // allowed units: mm, cm, in, px
        // width: "500px", // allowed units: mm, cm, in, px
        // orientation: "landscape" // portrait or landscape, defaults to portrait
    },
    
};

//Create your invoice! Easy!

const results = easyinvoice.createInvoice(data, function (result) {
    const pdfBuffer = Buffer.from(result.pdf, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.send(pdfBuffer);
});

       


    } catch (error) {
        console.log(error.message)
        
    }
}
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
        const product = await ProductDB.findById({_id:productId});
        await WishlistDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{products:{productId:productId}}})
        const data = await WishlistDB.findOne({userId:req.session.user_id}).populate('products.productId');
        if(data.products.length==0){
            await WishlistDB.findOneAndDelete({userId:req.session.user_id})
        }

    } catch (error) {
        console.log(error.message);
    }
}
//########### coupens ############3

const coupens = async(req,res)=>{
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
        const data = await CoupenDB.find({});
        res.render('coupens',{coupens:data,user:req.session.user_id,cartData,wishlistData,cartTotal})
    } catch (error) {
        console.log(error.message);
    }
}
const failePage = async(req,res)=>{
     try {
        const {addressId,coupen,paymentMethod} = req.query;
        console.log('failePage',req.query);
        const coupenData = await CoupenDB.findOne({coupenId:coupen});
        const offerData = await OfferDB.find({});
           
        const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
        const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
        console.log(addressdb)
        const address =  addressdb.address.find((a)=>{
            return a.equals(addressId);
        });

        const  date =  new Date().toISOString().slice(0,10);
       let productsData = products.products;

       for(let i=0;i<productsData.length;i++){
        let product = await ProductDB.findOne({_id:productsData[i].productId._id});
        console.log("start");
        
        if(productsData[i].productId.stock>0){

            product.stock=product.stock-productsData[i].quandity;
             await product.save();
        
             const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

             if(!exist){
                const money = products.products.reduce((acc,value)=>{
                                   
                    const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                    if(offerProduct){
                        return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                    }else{
                        return acc+parseInt(value.productId.Price)*value.quandity
                    }
                    
                },0);
                let coupenmoney = 0;
                      console.log('money',money);
                 if(coupenData){
                   
                    coupenmoney = money - Math.round(money*coupenData.offer/100);
                    await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                }else{
                    
                    coupenmoney = money
                }
                
                console.log('coupenmoney',coupenmoney);
            const data = new OrderDB({
                userId:req.session.user_id,
                products:[{
                    productId:productsData[i].productId._id,
                    productStatus:"pending",
                    paymentStatus:"Failed",
                    quandity:productsData[i].quandity,
                    orderDate:date,
                    paymentMethod:paymentMethod,
                    deliveryAddress:address,
                    productTotal:coupenmoney
                }]
            });
               await data.save();
               await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                console.log("success");
            }else{
                console.log(" products kk add akkanam");
                    let money=0;   
                    const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                    if(offerProduct){
                        money =  productsData[i].productId.Price*productsData[i].quandity - parseInt(productsData[i].productId.Price)*offerProduct.offerRate/100*productsData[i].quandity; 
                   
                    }else{
                        money = parseInt(productsData[i].productId.Price)*productsData[i].quandity
                    }
 
               let coupenmoney = 0;

                 if(coupenData){
                    console.log('coupenData', money*coupenData.offer/100)
                    coupenmoney = Math.round(money - money*coupenData.offer/100);
                    await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                }else{
                    
                    coupenmoney = money
                }
            
                await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                    productId:productsData[i].productId._id,
                    productStatus:"pending",
                    paymentStatus:"Failed",
                    quandity:productsData[i].quandity,
                    orderDate:date,
                    paymentMethod:paymentMethod,
                    deliveryAddress:address,
                    productTotal:coupenmoney
                }}}).populate('products.productId');

               
                await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')

             };
                
        }else{
            console.log("false");
            res.send({outofstock:true , product:product.name})
        }
        
      
       };

          
     } catch (error) {
        console.log(error.message);
     }
}
const successPage = async(req,res)=>{
    try { 
        const {addressId,coupen,paymentMethod} = req.query;
        const coupenData = await CoupenDB.findOne({coupenId:coupen});
        const offerData = await OfferDB.find({});
        if(paymentMethod=='Razor pay'){

            const products = await CartDB.findOne({userId:req.session.user_id}).populate('userId').populate('products.productId').populate('products.productId.categoryID')
            const addressdb = await AddressDB.findOne({userID:req.session.user_id}).populate('userID');
            console.log(addressdb)
            const address =  addressdb.address.find((a)=>{
                return a.equals(addressId);
            });

            const  date =  new Date().toISOString().slice(0,10);
           
           let productsData = products.products;
       
           for(let i=0;i<productsData.length;i++){
            let product = await ProductDB.findOne({_id:productsData[i].productId._id});
            console.log("start");
            
            if(productsData[i].productId.stock>0){
    
                product.stock=product.stock-productsData[i].quandity;
                 await product.save();
            
                 const exist = await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');

                 if(!exist){
                    const money = products.products.reduce((acc,value)=>{
                                       
                        const offerProduct = offerData.find( offer => offer.iteam === value.productId.name || offer.iteam === value.productId.categoryID.name)
                        if(offerProduct){
                            return acc+ value.productId.Price*value.quandity - parseInt(value.productId.Price)*offerProduct.offerRate/100*value.quandity; 
                        }else{
                            return acc+parseInt(value.productId.Price)*value.quandity
                        }
                        
                    },0);
                    let coupenmoney = 0;
                          console.log('money',money);
                     if(coupenData){
                       
                        coupenmoney = money - Math.round(money*coupenData.offer/100);
                        await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                    }else{
                        
                        coupenmoney = money
                    }
                    
                    console.log('coupenmoney',coupenmoney);
                const data = new OrderDB({
                    userId:req.session.user_id,
                    products:[{
                        productId:productsData[i].productId._id,
                        productStatus:"pending",
                        paymentStatus:"Paid",
                        quandity:productsData[i].quandity,
                        orderDate:date,
                        paymentMethod:paymentMethod,
                        deliveryAddress:address,
                        productTotal:coupenmoney
                    }]
                });
                console.log("data",data)
                   await data.save();
                   await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
                    console.log("success");
                }else{
                    console.log(" products kk add akkanam");
                        let money=0;   
                        const offerProduct = offerData.find( offer => offer.iteam === productsData[i].productId.name || offer.iteam === productsData[i].productId.categoryID.name)
                        if(offerProduct){
                            money =  productsData[i].productId.Price*productsData[i].quandity - parseInt(productsData[i].productId.Price)*offerProduct.offerRate/100*productsData[i].quandity; 
                       
                        }else{
                            money = parseInt(productsData[i].productId.Price)*productsData[i].quandity
                        }
     
                   let coupenmoney = 0;

                     if(coupenData){
                        console.log('coupenData', money*coupenData.offer/100)
                        coupenmoney = Math.round(money - money*coupenData.offer/100);
                        await CoupenDB.findOneAndUpdate({coupenId:coupen},{$push:{usedUsers:req.session.user_id}})
                    }else{
                        
                        coupenmoney = money
                    }
                
                    await OrderDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
                        productId:productsData[i].productId._id,
                        productStatus:"pending",
                        paymentStatus:"Paid",
                        quandity:productsData[i].quandity,
                        orderDate:date,
                        paymentMethod:paymentMethod,
                        deliveryAddress:address,
                        productTotal:coupenmoney
                    }}}).populate('products.productId');

                   
                    await CartDB.findOneAndDelete({userId:req.session.user_id}).populate('userId').populate('products.productId')
    
                 };
                    
            }else{
                console.log("false");
                res.send({outofstock:true , product:product.name})
            }
            
          
           };

           res.render('success');

        }else{
            res.render('success');
        }
           
       
    } catch (error) {
        console.log(error.message);
    }
}

const payAgain = async(req,res)=>{
    try {
        const {productId,productTotal,quandity,addressId} = req.query
        console.log(req.query);
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate('products.productId');
                    const userData = await User.findOne({userId: req.session.user_Id});
        
                    const amount =productTotal*100;
                    // console.log(amount)
                    const options = {
                        amount: amount,
                        currency: 'INR',
                        receipt: 'pkansif39@gmail.com'
                    }
                    instance.orders.create(options, 
                        (err, order)=>{
                            if(!err){
                                console.log(order)
                                res.send({
                                    success:true,
                                    msg:'Order Created',
                                    order_id:order.id,
                                    amount:amount,
                                    key_id:process.env.RAZOR_ID,
                                    // product_name:req.body.name,
                                    // description:req.body.description,
                                    // contact:"8567345632",
                                    productId:productId,
                                    quandity:quandity,
                                    addressId:addressId,
                                    name:userData.name,
                                    email: "pkansif39@gmail.com"
                                });
                            }else{
                                console.error("Error creating order:", err);
        
                                res.send({success:false,msg:'Something went wrong!'});
                            }
                        }
                    );
        

    } catch (error) {
        console.log(error.message);
    }
}

const repay = async(req,res)=>{
    try {
        const { addressId,amount,quandity,productId} = req.query;
        const orderData =  await OrderDB.findOne({userId:req.session.user_id}).populate('products.productId');
        console.log(req.query)
        const product = orderData.products.find((pro)=>{
            return pro._id.equals(productId)
        });
        
       product.paymentStatus="Paid"
       await orderData.save();
       res.render('success');
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
//#### login&register######
    register,
    loadOtp,
    verifyOtp,
    resendOtp,
    insertUser,
    login,
    loadforgetPassword,
    veryfyForgetPassword,
    loadnewPassword,
    veryfynewPassword,
    veryfyLogin,

//#### products ######
sort,
    loadHome,
    wcollection,
    mcollection,
    loadProducts,
    productsDetailes,
    userLogout,

//#### profile ######

    profile,
    loadedit,
    updateProfile,
    loadAddress,
    addAddress,
    saveAddress,
    loadeditAddress,
    veryfyAddress,
    removeAddress,

//#### cart ######

    addToCart,
    loadCartt,
    updateCart,
    deleteCart,
    
//##### order #####
     order,
     changeAddress,
     placeOrder,
     orderDetailes,
     cancelOrder,
     returnOrder,

     payAgain,
     repay,

    checkOut,  
    test,
    wishlist,
    addwishlist,
    deletewishlist,
    wallet,
    // razorpay ,

    coupens,
    successPage,
    failePage,

    test,
    errorpage,
    success,
    failed
    
}