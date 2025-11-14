const userModel = require("../model/userModel");
const ProductDB = require("../model/productModel");
const UserOtpVerification = require("../model/userOtpVerification");
const AddressDB = require("../model/addressModel");
const CartDB = require("../model/cartModel");
const OrderDB = require("../model/orderModel");
const WishlistDB = require("../model/wishlist");
const CoupenDB = require("../model/cuppenModel");
const OfferDB = require("../model/offerModel");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const pdf = require("html-pdf");
const nodemailer = require("nodemailer");
const walletModel = require("../model/walletModel");
const ReferalDB = require("../model/referalOfferModel");
const getStoreDataForUser  = require('../helperfunctions/helper') ;
const SibApiV3Sdk = require("@sendinblue/client");


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendOTPverificationEmail = async (email, res) => {
  try {
    // let transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.MY_EMAIL,
    //     pass: process.env.MY_PASSWORD,
    //   },
    // });
    const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

otp = `${Math.floor(1000 + Math.random() * 9000)}`;

await client.sendTransacEmail({
  sender: { email: process.env.MY_EMAIL },
  to: [{ email }],
  subject: "Verify your email",
  htmlContent: `<h3>Your OTP is ${otp}</h3>`,
});

    // mail options
    // const mailOptions = {
    //   from: process.env.MY_EMAIL,
    //   to: email,
    //   subject: "Verify Your email",
    //   html: `Your OTP is: ${otp}`,
    // };

    // hash ottp
    const saltRounds = 10;
   
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOtpVerifivation = new UserOtpVerification({
      email: email,
      otp: hashedOTP,
    });

    await newOtpVerifivation.save();
    console.log("checking...",process.env.MY_EMAIL,process.env.MY_PASSWORD,email)
    // await transporter.sendMail(mailOptions);
     console.log(otp,email);
   return res.json({ success: true, email });
  } catch (error) {
    console.log(error);
  }
};

//########### google ##############

const failed = async (req, res) => {
  try {
    res.send("failed");
  } catch (error) {
    console.log(error.message);
  }
};

const success = async (req, res) => {
  try {
    const name = req.user.displayName;
    const email = req.user.emails[0].value;
    const googleId = req.user.id;

    const userData = await userModel.findOne({ email: email });
    if (userData) {
      req.session.user_id = userData._id;
      res.redirect("/home");
    } else {
      const user = new userModel({
        name: name,
        email: email,
        is_verified: true,
        is_admin: 0,
        is_blocked: false,
        password: await securePassword(googleId),
      });
      const newUser = await user.save();
      if (newUser) {
        req.session.user_id = newUser._id;
        res.redirect("/home");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

//########### login&register ##############
const login = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadforgetPassword = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};
const loadchangePassword = async (req, res) => {
  try {
     const {cartData,wishlistData,cartTotal} = await getStoreDataForUser(req,res);

     res.render("changePassword",{cartData,wishlistData,cartTotal} );
  } catch (error) {
    console.log(error.message);
  }
};
const veryfyChangePassword = async (req, res) => {
  try {
      
      const user = await userModel.findById({_id:req.session.user_id});
      const {newPassword,conPassword,oldPassword} = req.body;
      console.log(req.body,user.email);
     
      let checkCurrentPassword = await bcrypt.compare(oldPassword,user.password);
      if(!checkCurrentPassword){
       return res.json({success:false,message:"Current Password is not Matching!."})
      }
      if(newPassword.length < 5  ){
       return res.json({success:false,message:"Enter a strong Password!."})
      }
      if(newPassword.length > 20  ){
       return res.json({success:false,message:"Password is Too Strong!."})
      }

      if(newPassword.length > 20  ){
       return res.json({success:false,message:"Password is Too Strong!."})
      }

      if(oldPassword == newPassword){
       return res.json({success:false,message:"You Cannot set the current password to your new Password!."})
      }
      if(newPassword !== conPassword){
       return res.json({success:false,message:"Confirm Password is Not Matching!."})
      }
      const securepassword = await securePassword(req.body.newPassword);
      await userModel.findByIdAndUpdate(
            { _id: req.session.user_id },
            { $set: { password: securepassword, token: "" } }
      );
      return res.json({success:true,message:"Successfuly Updated The Password!."})
      
  } catch (error) {
    console.log(error.message);
  }
};



const veryfyForgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await userModel.findOne({ email: email });
    if(!userData){
      return res.json({success:false,message:"Email Not Registerd!."})
    }
    if(userData.is_blocked == true){
       return res.json({success:false,message:"Access Deniedd!."})
    }

    const randomString = randomstring.generate();
    await userModel.findOneAndUpdate(
      { email: email },
      { $set: { token: randomString } }
    );
    await sendResetPasswordMail(userData.name, userData.email, randomString);
    return res.json({success:true, message: "Reset Password Link is Sent to Your Mail"})
   
  } catch (error) {
    console.log(error.message);
  }
};

const sendResetPasswordMail = async (name, email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    // mail options
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>Hi ${name},</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${process.env.BASE_URL}/forgetPassword?token=${token}">Reset Password</a>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
};

const loadnewPassword = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await userModel.findOne({ token: token });
    res.render("newPassword", { user_id: tokenData?._id });

  } catch (error) {
    console.log(error.message);
  }
};

const veryfynewPassword = async (req, res) => {
  try {
 
    const {userId} = req.query;
    const {password,conPassword} = req.body;
    
    if(!userId){
      return res.json({success:false,message:"Invalid Tocken!."})
    }
    if(password.trim().length < 8 || password.trim().length > 20 ){
       return res.json({success:false, message: "Password must be in between 8 - 20 charectors!."})
    }
    if(password.trim() !== conPassword.trim()){
       return res.json({success:false, message: "confirm password not match"})
    }
    const user = await userModel.findOne({_id:userId});
    let checkCurrentPassword = await bcrypt.compare(password.trim(),user.password);
    if(checkCurrentPassword){
      return res.json({success:false, message: "You cannot set the current password Again!."})
    }
    const securepassword = await securePassword(password.trim());

    const userData = await userModel.findByIdAndUpdate(
          { _id:userId },
          { $set: { password: securepassword, token: "" } }
    );

   
     return res.json({success:true, message: "Successfully Updated The Password"})

  } catch (error) {
    console.log(error.message);
  }
};

const register = async (req, res) => {
  try {
    const {refferalCode} = req.query
    res.render("register",{refferalCode});
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const {refferalCode} = req.query;
    const {name,email,password,mobile} = req.body;
    
    if(refferalCode){
       const refaralOffer = await ReferalDB.findOne();
       if(!refaralOffer){
        return res.json({ success: false, message: "No Refferal Offer Currently Available" });
       }
       const referredUser = await userModel.findOne({reffaralCode:refferalCode})
       if(!referredUser){
        return res.json({ success: false, message: "Invalid Refferal Code" });
       }
    } 
      
    
    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
      return res.json({ nameError: "invalid name provide" });
    }
    if (!/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(email.trim())) {
      return res.json({ nameError: "invalid name provide" });
    }
    const emailCheck = await userModel.findOne({ email:email.trim() });
    if (emailCheck) {
      return res.json({ emailError: "Email Already Exists" });
    }
    const mobileLength = mobile.trim().length;
    if (mobileLength !== 10) {
      return res.json({ mobileError: "Mobile Number Should Be 10 Degit" });
    }
    const passLength = password.trim().length;
    if (passLength < 8 || passLength > 20) {
      return res.json({ passwordError: "Password Should be in between 8 - 20" });
    }
    req.session.user = {
      email: email.trim(),
      name: name.trim(),
      mobile: mobile.trim(),
      password: await securePassword(password.trim()),
      is_admin: 0,
      is_blocked: false,
      is_verified: false,
      refferalCode
    };
    sendOTPverificationEmail(email.trim(), res);
    return;
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtp = async (req, res) => {
  try {
    const email = req.query.email;
    await UserOtpVerification.findOne({ email: email });
    
    res.render("otp", { email: email });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    let balance = 0;
    const history = []
   
    const userVerification = await UserOtpVerification.findOne({
      email: email,
    });
    if (!userVerification) {
      res.json({ success: false, message: "OTP Expird" });
      return;
    }
    const { otp: hashotp } = userVerification;
    const validOtp = await bcrypt.compare(otp, hashotp);
    console.log(validOtp, "check otp");
    if (!validOtp) {
      res.json({ success: false, message: "Invalid OTP" });
      return;
    }
    await UserOtpVerification.findOneAndDelete({email: email});

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
            
      const reffaralCode = generateRefferalCode(req.session.user.email,4);
    // creating user

    const userData = new userModel({
      email: req.session.user.email,
      name: req.session.user.name,
      mobile: req.session.user.mobile,
      password: req.session.user.password,
      is_admin: req.session.user.is_admin,
      is_blocked: req.session.user.is_blocked,
      is_verified: true,
      reffaralCode:reffaralCode,
    });
     
    await userData.save()
    // creating cart
    const cart = new CartDB({
      userId: userData._id,
      products: [],
    });
    await cart.save();
   
    // creating wallet
    
     if(req.session.user.refferalCode){

       const refaralOffer = await ReferalDB.findOne();
       const referredUser = await userModel.findOne({reffaralCode:req.session.user.refferalCode})

       balance = refaralOffer.newUserAmount;
       str=`Credit : Referal Amount RS : ${refaralOffer.refaralUserAmount} Has Been Credited`
       await walletModel.findOneAndUpdate({userId:referredUser._id},{$push:{walletHistery:`Credit : Referal Amount RS : ${refaralOffer.refaralUserAmount} Has Been Credited`}});
       history.push(`Credit : Refferal Welcome Offer Rs${refaralOffer.newUserAmount} Has Been Credited.`)
    }
  
    const wallet = new walletModel({
      userId: userData._id,
      Balance: balance,
      walletHistery: history,
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

    req.session.user_id = userData._id;
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.query;
    if(!email){
      return res.json({success:false,message:"Somthing Went Wrong!."})
    }
    await UserOtpVerification.findOneAndDelete({ email: email });
    await sendOTPverificationEmail(email, res);
  } catch (error) {
    console.log(error.message);
  }
};

const veryfyLogin = async (req, res) => {
  try {

    const {email,password} = req.body;
    const userData = await userModel.findOne({ email: email });
    if(!userData){
      return res.json({success:false,message: "User Not Found" });
    }
     const passwordMatch = await bcrypt.compare(password, userData.password);
     if(!passwordMatch){
     return res.json({success:false, message: "Email or Password is incorrect" });
     }

        if (userData.is_blocked == false) {
          if (userData.is_verified == true) {
            req.session.user_id = userData._id;
            return res.json({success:true});
          } else {
            return res.json({success:false, message:"Your Access Denied By Admin" });
          }
        } else {
          return res.json({success:false, message: "Your Access Denied By Admin" });
        }
  
  } catch (error) {
    console.log(error.message);
  }
};

//########### products ##############

const loadHome = async (req, res) => {
  try {
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    });
    const offerData = await OfferDB.find({});
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }
    res.render("home", { cartData, wishlistData, cartTotal });
  } catch (error) {
    console.log(error.message);
  }
};



const productsDetailes = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    })
    const offerData = await OfferDB.find({});
    const productData = await ProductDB.findById({
      _id: req.query.id,
    }).populate("categoryID");
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }
    
    
    res.render("detailes", {
      productData,
      offerData,
      cartData,
      cartTotal,
      wishlistData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const sort = async(req,res)=>{
 try {
    const {cartData,wishlistData,offerData} = await getStoreDataForUser(req,res);
    const {sort,filter,search} = req.query;
    const sortQuery = {};
    const limit = 8;
  

    switch (sort) {
      case "Sort by Price: high to low":
        sortQuery.Price=-1
        break;
      case "Sort by Price: low to high":
        sortQuery.Price=1
        break;
      case "Sort by Name : Z-A":
        sortQuery.name=-1
        break;
      case "Sort by Name : A-Z":
        sortQuery.name=1
        break;
      case "Old":
        sortQuery.createdAt = 1
        break;
      default:
         sortQuery.createdAt = -1
        break;
    }

   
    
    let data =  await ProductDB.find({$and:[{is_listed:true},{name:{$regex: ".*" + search + ".*", $options: "i"}}]}).sort(sortQuery).populate("categoryID");
    let products =  data.filter((val)=>{
      if(filter == "All" ){
         return val.categoryID.is_listed == true 
      }else if(filter == "Out Of Stock"){
        return val.categoryID.is_listed == true && val.stock < 1
      }else if(filter == "In Stock"){
        return val.categoryID.is_listed == true && val.stock > 0
      }else{
        return val.categoryID.is_listed == true && val.categoryID.name == filter
      }
    });
  
    const totalPage = Math.ceil(products.length/limit);
    products =  products.slice(0,limit);
   return res.json({productData:products,offerData, wishlistData, cartData ,totalPage})

 

 } catch (error) {
  console.error(error.message)
 }
}

const paginationProduct = async (req, res) => {
  try {
   
    const {cartData,wishlistData,offerData} = await getStoreDataForUser(req,res);
    const {sort,filter,page,search} = req.query;
    const sortQuery = {};
    const limit = 8;
  

    switch (sort) {
      case "Sort by Price: high to low":
        sortQuery.Price=-1
        break;
      case "Sort by Price: low to high":
        sortQuery.Price=1
        break;
      case "Sort by Name : Z-A":
        sortQuery.name=-1
        break;
      case "Sort by Name : A-Z":
        sortQuery.name=1
        break;
      case "Old":
        sortQuery.createdAt = 1
        break;
      default:
         sortQuery.createdAt = -1
        break;
    }


    
    let data =  await ProductDB.find({$and:[{is_listed:true},{name:{$regex: ".*" + search + ".*", $options: "i"}}]}).sort(sortQuery).populate("categoryID");
    let products =  data.filter((val)=>{
      if(filter == "All" ){
         return val.categoryID.is_listed == true 
      }else if(filter == "Out Of Stock"){
        return val.categoryID.is_listed == true && val.stock < 1
      }else if(filter == "In Stock"){
        return val.categoryID.is_listed == true && val.stock > 0
      }else{
        return val.categoryID.is_listed == true && val.categoryID.name == filter
      }
    });
  
    const totalPage = Math.ceil(products.length/limit);
    products =  products.slice((page-1)*limit,(limit*page));
   return res.json({productData:products,offerData, wishlistData, cartData ,totalPage})
  } catch (error) {
    console.log(error.message);
  }
};
const searchProduct = async (req, res) => {
  try {
    const {search,filter} = req.query;
    const {cartData,wishlistData,offerData} = await getStoreDataForUser(req,res);
    const limit = 8;

    
    let data =  await ProductDB.find({$and:[{is_listed:true},{name:{$regex: ".*" + search + ".*", $options: "i"}}]}).sort({createdAt:-1}).populate("categoryID");
    
    let products;

    if(filter){
       products =  data.filter((val)=>val.categoryID.is_listed == true&& val.categoryID.name == filter );
    }else{
       products =  data.filter((val)=>val.categoryID.is_listed == true );
    }
  
    const totalPage = Math.ceil(products.length/limit);
    products =  products.slice(0,limit);
    return res.json({productData:products,offerData, wishlistData, cartData ,totalPage})
  } catch (error) {
    console.log(error.message);
  }
};
const errorpage = async (req, res) => {
  try {
    res.render("error");
  } catch (error) {
    console.log(error.message);
  }
};

//########### profile ##############

const profile = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData?.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }
    const userData = await userModel.findById({ _id: req.session.user_id });
    const referral = await ReferalDB.findOne();
 
    res.render("profile", {
      user: userData,
      cartData,
      wishlistData,
      referral,
      cartTotal,
      baseUrl:process.env.BASE_URL
    });

  } catch (error) {
    console.log(error.message);
  }
};

const loadedit = async (req, res) => {
  try {

    const {name,mobile,email} = await userModel.findById({ _id: req.query._id });
    res.render("edit", { name,mobile,email });

  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const {name,mobile} = req.body;
    const user = await userModel.findById({ _id: req.session.user_id });

    if(!user ){
      return res.json({success:false,message:'User Not Found!.'});
    }
    
    if(!/^[a-zA-Z\s]+$/.test(name) || name.length > 20 ){
       return res.json({success:false,message:'Invalid Name Provided!.'});
    }

    if(mobile.length > 10 || mobile.length < 10){
       return res.json({success:false,message:'Invalid Mobile Number Provided!.'});
    }
      await userModel.findByIdAndUpdate(
            { _id: req.session.user_id  },
            {
              name: name,
              mobile: mobile,
            }
          );
    res.send({success:true,message:'Successfully update the changes!.'})

  } catch (error) {
    console.log(error.message);
  }
};

const changeEmail = async (req, res) => {
  try {
     const user = await userModel.findById({ _id: req.session.user_id });
     res.render("emailChange",{email:user.email});
    

  } catch (error) {
    console.log(error.message);
  }
};

const verifychangeEmail = async (req, res) => {
  try {
    const {email} = req.body;
    const user = await userModel.findById({ _id: req.session.user_id });
    if(!user){
      return res.json({success:false,message:'User Not Found!.'});
    }

    if(user.email == email){
      return res.json({success:false,message:'You Cannot make the Old Email Again!.'});
    }
    

    if(!/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)){
      return res.json({success:false,message:'Invalid Email Structure!.'});
    }

    const checkEmail = await userModel.findOne({email});
    if(checkEmail && checkEmail._id.toString() !== user._id.toString() ){
      return res.json({success:false,message:'Email ALready Exists!.'});
    }
    await sendOTPverificationEmail(email,res);
   
    
  } catch (error) {
    console.log(error.message);
  }
};
const verifychangeEmailOtp = async (req, res) => {
  try {
      const {email,otp} = req.body;
      console.log(email,"email to check",otp)
      const userVerification = await UserOtpVerification.findOne({
      email: email,
    });
    if (!userVerification) {
      res.json({ success: false, message: "OTP Expird" });
      return;
    }
    const { otp: hashotp } = userVerification;
    const validOtp = await bcrypt.compare(otp, hashotp);
    console.log(validOtp, "check otp");
    if (!validOtp) {
      res.json({ success: false, message: "Invalid OTP" });
      return;
    }
    
    await userModel.findByIdAndUpdate({ _id: req.session.user_id },{$set:{email:email}});
    await UserOtpVerification.findOneAndDelete({email:email});

    res.send({success:true,message:"Successfullyy Updated The Email!."})


  } catch (error) {
    console.log(error.message);
  }
};
const userLogout = async (req, res) => {
  try {
    req.session.destroy();

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }
    res.render("addAddress", {
      cartData,
      wishlistData,
      cartTotal,
      message1: req.flash("msg1"),
      message2: req.flash("msg2"),
      message3: req.flash("msg3"),
      message4: req.flash("msg4"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const saveAddress = async (req, res) => {
  try {


    const {fname,lname,address,country,mobile,city,pincode,state} = req.body;
    const addresses = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");


    if(!/^[a-zA-Z]+$/.test(fname)){
      return res.json({success:false,message:'Invalid First Name!.'})
    }
    if(!/^[a-zA-Z]+$/.test(fname)){
     return res.json({success:false,message:'Invalid Second Name!.'})
    }
    if(mobile.length > 10 || mobile.length < 10){
     return res.json({success:false,message:'Invalid Mobile Number!.'})
    }

    const checkAddress = addresses.address.find( (addr) => addr.fname==fname && addr.lname==lname && addr.address==address) ;
    if(checkAddress){
      return res.json({success:false,message:"This Address Already Exist!."})
    }

    const newAddresses = await AddressDB.findOneAndUpdate (
                  { userID: req.session.user_id },
                  {
                    $push: {
                      address: {
                        fname: fname,
                        lname: lname,
                        country: country,
                        address: address,
                        city: city,
                        state: state,
                        pincode: pincode,
                        mobile: mobile,
                        email: addresses.userID.email,
                      },
                    },
                  },
                  {new:true}
                );

             return   res.json({success:true,addresses:newAddresses,message:"Successfully added the Address!."})
     
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddress = async (req, res) => {
  try {

    const {cartData,wishlistData,cartTotal} = await getStoreDataForUser(req,res)
   
    let page;
  
    const limit = 2;
    const data = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .limit(limit)
    const count = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .countDocuments();

    res.render("address", {
      addressData: data,
      totalPage: Math.ceil(count / limit),
      cartData,
      wishlistData,
      cartTotal,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const paginationAddress = async (req, res) => {
  try {
    const {page} = req.query;
    const limit = 2;
    const data = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .skip((page - 1) * limit)
      .limit(limit * page)
    const count = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .countDocuments();

    res.render("address", {
      addressData: data,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadeditAddress = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }
    const data = await AddressDB.findOne({ "address._id": req.query._id });

    const productUpdate = data.address.find((a) => {
      return a._id.equals(req.query._id);
    });

    res.render("editAddress", {
      addressData: productUpdate,
      cartData,
      wishlistData,
      cartTotal,
      message1: req.flash("msg1"),
      message2: req.flash("msg2"),
      message3: req.flash("msg3"),
      message4: req.flash("msg4"),
    });
  } catch (error) {
    console.log(error.message);
  }
};

const veryfyAddress = async (req, res) => {
  try {

    const {fname,lname,address,country,mobile,city,pincode,state} = req.body;
    console.log('req.query._id',req.query._id,req.body)
    const addresses = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");

    const currentAddress = addresses.address.find((a) => {
      return a._id.equals(req.query._id);
    });

    if(!/^[a-zA-Z]+$/.test(fname)){
      return res.json({success:false,message:"Invalid First Name"})
    }
    if(!/^[a-zA-Z]+$/.test(lname)){
       return res.json({success:false,message:"Invalid Second Name"})
    }
 

    const checkAddress = addresses.address.find((addr) => addr.address == address);
    console.log('currentAddress',currentAddress)
    console.log('checkAddress',checkAddress)
    if(checkAddress && checkAddress._id.toString() !== currentAddress._id.toString()){
      res.json({success:false,message:"Address Already Exists!."})
    }
    
    currentAddress.fname = fname;
    currentAddress.lname = lname;
    currentAddress.address = address;
    currentAddress.country = country;
    currentAddress.state = state;
    currentAddress.city = city;
    currentAddress.pincode = pincode;
    currentAddress.mobile = mobile;
    await addresses.save();
    return res.json({success:true,message:"Address Edited Successfully!."})
  } catch (error) {
    console.log(error.message);
  }
};

const removeAddress = async (req, res) => {
  try {
    const { _id } = req.query;
    const data = await AddressDB.findOneAndUpdate(
      { userID: req.session.user_id },
      { $pull: { address: { _id: _id } } },
      {new:true}
    );
    return res.json({success:true,length:data.address.length,message:"Address Deleted Successfully!."})
  } catch (error) {
    console.log(error.message);
  }
};
//############ cart ####################
const handleCart = async (req, res) => {
  try {

    const { productId } = req.query;
    const { quantity } = req.body;
    
    const userCart = await CartDB.findOne({ userId: req.session.user_id });
    if(!userCart){
      res.json({success:false,message:"Cart Not Found."})
    }
    const product = await ProductDB.findById({ _id: productId })
    if(!product){
      res.json({ success: false, message: "Product Not Found." });
    }
  
    const check  = await CartDB.findOne({ userId: req.session.user_id,'products.productId':{$in:[productId]}})
    const offerData  = await OfferDB.find();
    if(check){
      const newCart = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{'products':{
        productId:product._id,
        quandity:quantity,
       }}},{new:true}).populate("products.productId");
       const totel = newCart.products.reduce((acc,val)=>{
        const offerProduct = offerData.find((offer) => offer.iteam === val.productId.name || offer.iteam === val.productId.categoryID.name);
        if (offerProduct) {
          return (acc +val.productId.Price * val.quandity - ((val.productId.Price * offerProduct.offerRate) / 100) * val.quandity );
        } else {
          return acc + (val.productId.Price*val.quandity);
        }
       },0);
       res.json({ success: true,totel,count:newCart.products.length,removed:true });
    }else{
     
       const newCart = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
        productId:product._id,
        quandity:quantity,
       }}},{new:true}).populate("products.productId");
       const totel = newCart.products.reduce((acc,val)=>{
        const offerProduct = offerData.find((offer) => offer.iteam === val.productId.name || offer.iteam === val.productId.categoryID.name);
        if (offerProduct) {
          return (acc +val.productId.Price * val.quandity - ((val.productId.Price * offerProduct.offerRate) / 100) * val.quandity );
        } else {
          return acc + (val.productId.Price*val.quandity);
        }
       },0);
       res.json({ success: true,totel,count:newCart.products.length,added:true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeOutofStock = async (req, res)=>{
  try {
    const newCart = await CartDB.findOne({userId:req.session.user_id}).populate("products.productId");
   
     newCart.products = newCart.products.filter((value)=>value.productId.stock >= value.quandity  )
   
    await newCart.save();
    if(newCart.products.length>0){
      res.send({success:true})
    }else{
      res.send({success:false,message:"Your cart is empty now!."})
    }
  
    
  } catch (error) {
    console.log(error.message);
  }
}

const loadCartt = async (req, res) => {
  try {
    
    const offerData = await OfferDB.find({});

    const user = await CartDB.findOne({ userId: req.session.user_id })
      .populate("userId")
      .populate({
        path: "products.productId",
        populate: { path: "categoryID" },
      });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");

    let subTotal = 0;
    if (user) {
      subTotal = user.products.reduce((acc, productsId) => {
        parseInt(productsId.quandity);
        parseInt(productsId.productId.Price);
        const offer = offerData.find(
          (value) =>
            value.iteam === productsId.productId.name ||
            value.iteam === productsId.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            productsId.quandity * productsId.productId.Price -
            Math.round(
              (productsId.quandity *
                productsId.productId.Price *
                offer.offerRate) /
                100
            )
          );
        } else {
          return acc + productsId.quandity * productsId.productId.Price;
        }
      }, 0);
    }
   
    res.render("cart", {
      productData: user,
      offerData: offerData,
      subTotal: subTotal,
      wishlistData,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const updateCart = async (req, res) => {
  try {
    const { productId,  quandity } = req.body;

    const offerData = await OfferDB.find({});
    const cart = await CartDB.findOne({ userId: req.session.user_id })
      .populate("userId")
      .populate({
        path: "products.productId",
        populate: { path: "categoryID" }, 
      });
    const productUpdate = cart.products.find((p) => {
      return p.productId.equals(productId);
    });
       
    if(productUpdate.productId.stock < 1 ){
      return res.json({success:false,message:`Product ${productUpdate.productId.name} is Out of stock!.`})
    }
    if(productUpdate.productId.stock < quandity ){
      return res.json({success:false,message:"Product Quandity Exeeded Product Stock!."})
    }
    let prevQuandity = productUpdate.quandity;
    const q = parseInt(quandity);
    productUpdate.quandity = q;

    let newCart = await cart.save(); 
    
    let total = 0 ;
    let discount = 0 ;
    let productDiscount = 0 ;
    let subTotal = 0 ;
    newCart.products.map((product) => {
       subTotal+=product.productId.Price * product.quandity;
       const offer = offerData.find((value) => (value.iteam === product.productId.name || value.iteam === product.productId.categoryID.name));
      if(offer){
        discount =  - Math.floor(product.productId.Price * (offer.offerRate/100)) ;
        discount = discount * product.quandity
      }
    });

    const offer = offerData.find((value) => (value.iteam === productUpdate.productId.name || value.iteam === productUpdate.productId.categoryID.name));
    if(offer){
      productDiscount =  - Math.floor(productUpdate.productId.Price * (offer.offerRate/100)) ;
      productDiscount = productDiscount * productUpdate.quandity
    }
    total = subTotal + discount;
    const productTotal = (productUpdate.productId.Price * productUpdate.quandity) + productDiscount;
    res.json({success:true, subTotal ,total,discount,productTotal });

 
  } catch (error) {
    console.log(error.message);
  }
};
const deleteCart = async (req, res) => {
  try {
    const { productId } = req.query;
    const offerData = await OfferDB.find({});
    const cart = await CartDB.findOneAndUpdate(
      { userId: req.session.user_id },
      { $pull: { products: { productId: productId } } },{new:true}
    )
      .populate("userId")
      .populate("products.productId");
      let subTotal = 0;
      let checkOffer = false;
      const newprice = cart.products.reduce((acc, product) => {
        const offer = offerData.find(
          (value) =>
            value &&
            (value.iteam === product.productId.name ||
              value.iteam === product.productId.categoryID.name)
        );
        var amount = 0;
        if (offer) {
          checkOffer=true;
          amount =
            Math.round((product.productId.Price * offer.offerRate) / 100) *
            product.quandity;
        }
        subTotal+=product.productId.Price * product.quandity;
        return acc + product.productId.Price * product.quandity - amount;
      }, 0);
      res.status(200).json({ total: newprice,subTotal,checkOffer });
   
  } catch (error) {
    console.log(error.message);
  }
};
const proceedCheckout = async (req, res) => {
  try {
     const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");

 
    cartData.products.map((product)=>{
      if(product.productId.stock < product.quandity){
        return res.json({success:false,message:`The Product ${product.productId.name} is Not Have Enogh Stock!.`});
      }
    })
    res.json({success:true})

  } catch (error) {
    console.log(error.message);
  }
};

//############### checkout ############
const checkOut = async (req, res) => {
  try {
    const { cartData, wishlistData, offerData, cartTotal } = await getStoreDataForUser(req, res);
    const total = cartData.products.reduce((acc,cur)=>acc+=(cur.productId.Price*cur.quandity),0);
    const date = new Date();
    const  coupons = await CoupenDB.find({expiryDate:{$gte:date},usedUsers:{$nin:req.session.user_id}});
   
    const address = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");
        res.render("checkout", {
          productData: cartData,
          addressData: address,
          offer:total - cartTotal,
          offerData: offerData,
          subTotal: total,
          total:cartTotal,
          cartData: cartData,
          productsLength:cartData.products.length,
          wishlistData: wishlistData,
          cartTotal,
          coupons
        });
  
    
  } catch (error) {
    console.log(error.message);
  }
};

const changeAddress = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    const productData = await ProductDB.find({ is_listed: true }).populate(
      "categoryID"
    );
    const rate = offerData.offerRate / 100;
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
        value;
        const offer = offerData.find(
          (iteam) =>
            iteam.iteam === value.productId.name ||
            iteam.iteam === value.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            value.productId.Price * value.quandity -
            Math.round(
              (value.productId.Price * value.quandity * offer.offerRate) / 100
            )
          );
        } else {
          return acc + value.productId.Price * value.quandity;
        }
      }, 0);
    }

    const check = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");
    const name = req.body.address.trim();

    if (!check) {
      const fname = req.body.fname.trim();
      const lname = req.body.lname.trim();
      const name = req.body.address.trim();
      if (/^[a-zA-Z]+$/.test(fname)) {
        if (/^[a-zA-Z]+$/.test(lname)) {
          if (/^[a-zA-Z\s]+$/.test(name)) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
              const data = new AddressDB({
                userID: req.session.user_id,
                address: [
                  {
                    fname: req.body.fname,
                    lname: req.body.lname,
                    country: req.body.country,
                    address: req.body.address,
                    city: req.body.city,
                    state: req.body.state,
                    pincode: req.body.pincode,
                    mobile: req.body.mobile,
                    email: req.body.email,
                  },
                ],
              });
              await data.save();
              const address = await AddressDB.findOne({
                userID: req.session.user_id,
              }).populate("userID");
              const cart = await CartDB.findOne({ userId: req.session.user_id })
                .populate("userId")
                .populate("products.productId");

              res.redirect("/checkout");
            } else {
              req.flash("msg4", "Check Your Email Structure");
              res.redirect("/checkout");
            }
          } else {
            req.flash("msg3", "Invalid Address");
            res.redirect("/checkout");
          }
        } else {
          req.flash("msg2", "invalid Lname");
          res.redirect("/checkout");
        }
      } else {
        req.flash("msg1", "Invalid Fname");
        res.redirect("/checkout");
      }
    } else {
      const exist = await AddressDB.findOne({
        userID: req.session.user_id,
      }).populate("userID");

      const fname = req.body.fname.trim();
      const lname = req.body.lname.trim();
      const name = req.body.address.trim();
      if (/^[a-zA-Z]+$/.test(fname)) {
        if (/^[a-zA-Z]+$/.test(lname)) {
          if (/^[a-zA-Z\s]+$/.test(name)) {
            const checkAddress = exist.address.find(
              (address) =>
                address.fname == fname &&
                address.lname == lname &&
                address.address == name
            );
            if (!checkAddress) {
              if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
                const changeAddress = await AddressDB.findOneAndUpdate(
                  { userID: req.session.user_id },
                  {
                    $push: {
                      address: {
                        fname: req.body.fname,
                        lname: req.body.lname,
                        country: req.body.country,
                        address: req.body.address,
                        city: req.body.city,
                        state: req.body.state,
                        pincode: req.body.pincode,
                        mobile: req.body.mobile,
                        email: req.body.email,
                      },
                    },
                  }
                );
                const x = await changeAddress.save();
                const address = await AddressDB.findOne({
                  userID: req.session.user_id,
                }).populate("userID");
                const data = await CartDB.findOne({
                  userId: req.session.user_id,
                })
                  .populate("userId")
                  .populate("products.productId");

                res.redirect("/checkout");
              } else {
                req.flash("msg4", "Check Your Email Structure");
                res.redirect("/checkout");
              }
            } else {
              req.flash("msg3", "This Address Already Exists");
              res.redirect("/checkout");
            }
          } else {
            req.flash("msg3", "Invalid address");
            res.redirect("/checkout");
          }
        } else {
          req.flash("msg2", "Invalid Lname");
          res.redirect("/checkout");
        }
      } else {
        req.flash("msg1", "Invalid Fname");
        res.redirect("/checkout");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const test = async (req, res) => {
  try {
    const { productId } = req.query;
    const today = new Date()
    const offer = await OfferDB.find({validity:{$gte:today}},{iteam:1,offerRate:1,_id:0});
    const orderData = await OrderDB.findOne({ _id: productId})
      .populate("userId")
      .populate("products.productId");
    const total = orderData.products
    .filter((order)=>order.productStatus == "pending" || order.productStatus == "Delivered" || order.productStatus == "returnPending")
    .reduce((acc,cur)=>{
      return acc+=cur.productId.Price;
    },0);
    const data = {
      orderData: orderData,
      total,
      offer
    };
    const filepathname = path.resolve(__dirname, '../views/users/invoice.ejs');
    const htmlString = fs.readFileSync(filepathname).toString();
    let options = {
      format: 'A4',
      orientation: "portrait",
      border: "10mm"
    };
    const ejsData = ejs.render(htmlString, data);
    pdf.create(ejsData, options).toFile('invoice.pdf', (err, response) => {
    if (err) console.log(err);
    
    const filePath = path.resolve(__dirname, '../invoice.pdf');
    fs.readFile(filePath, (err, file) => {
        if (err) {
          console.log(err);
          return res.status(500).send('could not doenload the file')
        }
        
        res.setHeader('Content-type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment;filename="invoice.pdf"');
        res.send(file)
      })
    })
   
    return;
    // const { productId } = req.query;
    
    // const orderData = await OrderDB.findOne({ _id: productId})
    //   .populate("userId")
    //   .populate("products.productId");
    //   let products = [];
    //   orderData.products.find((product) => {
    //     products.push({
    //       quantity: product.quandity,
    //       description: product.productId.name,
    //       price: product.productId.Price
    //     })
    //   });
    //    const offer = orderData.products.reduce((acc,cur)=>{
    //     return acc+ (cur.productId.Price*cur.quandity) - cur.productTotal
    //    },0)
    
    //   products.push({
    //   description: "Discount",
    //   price: -offer
    // })
    
    // const date = new Date().toISOString().slice(0, 10);

    // const data = {
    //   apiKey: "free", // Please register to receive a production apiKey: https://app.budgetinvoice.com/register
    //   mode: "development", // Production or development, defaults to production
    //   images: {
    //     // The logo on top of your invoice
    //     logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
    //     // The invoice background
    //     // background: "https://public.budgetinvoice.com/img/watermark-draft.jpg"
    //   },
    //   // Your own data
    //   sender: {
    //     company: "Molla",
    //     address: "MG Street",
    //     zip: "560001",
    //     city: "Bangaloru",
    //     country: "INDIA",
    //   },
    //   // Your recipient
    //   client: {
    //     company: orderData.userId.name,
    //     address: orderData.products[0].deliveryAddress.address,
    //     zip: orderData.products[0].deliveryAddress.pincode,
    //     city: orderData.products[0].deliveryAddress.city,
    //     country: orderData.products[0].deliveryAddress.country,
    //   },
    //   information: {
    //     // Invoice data
    //     date: date,
    //     // Invoice due date
    //     // dueDate: "31-12-2021"
    //   },
    //   // The products you would like to see on your invoice
    //   // Total values are being calculated automatically
    //   products: products,
    //   // Settings to customize your invoice
    //   settings: {
    //     currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
    //     // locale: "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')
    //     // marginTop: 25, // Defaults to '25'
    //     // marginRight: 25, // Defaults to '25'
    //     // marginLeft: 25, // Defaults to '25'
    //     // marginBottom: 25, // Defaults to '25'
    //     // format: "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
    //     // height: "1000px", // allowed units: mm, cm, in, px
    //     // width: "500px", // allowed units: mm, cm, in, px
    //     // orientation: "landscape" // portrait or landscape, defaults to portrait
    //   },
    // };

    // //Create your invoice! Easy!

    // const results = easyinvoice.createInvoice(data, function (result) {
    //   const pdfBuffer = Buffer.from(result.pdf, "base64");
    //   res.setHeader("Content-Type", "application/pdf");
    //   res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    //   res.send(pdfBuffer);
    // });
  } catch (error) {
    console.log(error.message);
  }
};


//########### coupens ############3

const coupens = async (req, res) => {
  try {
    const cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    let cartTotal = 0;
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, productsId) => {
        parseInt(productsId.quandity);
        parseInt(productsId.productId.Price);
        const offer = offerData.find(
          (value) =>
            value.iteam === productsId.productId.name ||
            value.iteam === productsId.productId.categoryID.name
        );
        if (offer) {
          return (
            acc +
            productsId.quandity * productsId.productId.Price -
            Math.round(
              (productsId.quandity *
                productsId.productId.Price *
                offer.offerRate) /
                100
            )
          );
        } else {
          return acc + productsId.quandity * productsId.productId.Price;
        }
      }, 0);
    }
    const limit = 4;
    const count = await CoupenDB.find({}).countDocuments();
    const data = await CoupenDB.find({}).limit(limit);
    res.render("coupens", {
      coupens: data,
      user: req.session.user_id,
      cartData,
      wishlistData,
      totalPage:Math.ceil(count/limit),
      cartTotal,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const searchCoupon = async (req, res) => {
  try {
    const {search} = req.query;
    const limit = 4;
    console.log(req.query)
    const count = await CoupenDB.find({name:{$regex: ".*" + search + ".*", $options: "i"}}).countDocuments();
    const data = await CoupenDB.find({name:{$regex: ".*" + search + ".*", $options: "i"}})
    return res.json({coupons:data,totelPage:Math.ceil(count/limit)})
  } catch (error) {
    console.log(error.message);
  }
};
const paginationCoupon = async (req, res) => {
  try {
    const {page} = req.query;
    const limit = 4;
    const count = await CoupenDB.find({}).countDocuments();
    const data = await CoupenDB.find({}).skip((page-1)*limit).limit(limit*page);
    res.json({  coupens: data, user: req.session.user_id,totalPage:Math.ceil(count/limit)})
  } catch (error) {
    console.log(error.message);
  }
};
const filterCoupon = async (req, res) => {
  try {
    const {filter} = req.query;
    const limit = 4;
    const date = new Date();
    let coupons 
    switch (filter) {
      case "All":
        coupons = await CoupenDB.find({})
        break
      case "Active":
        coupons = await CoupenDB.find({$and:[ { usedUsers: { $nin: [req.session.user_id] } },{expiryDate:{$gte:date}}]})
        break
      case "Used":
         coupons = await CoupenDB.find({ usedUsers: { $in: [req.session.user_id] } })
        break
      case "Expired":
         coupons = await CoupenDB.find({expiryDate:{$lt:date}})
        break;
      default:
        break;
    }
    const totalPage =  Math.ceil(coupons.length/limit)
    coupons = coupons.slice(0,limit)
    return res.json({  coupens: coupons, user: req.session.user_id,totalPage});

  } catch (error) {
    console.log(error.message);
  }
};

const about = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    console.log(error.message);
  }
};

const contact = async (req, res) => {
  try {
    res.render("contact");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  //#### login&register######
  register,
  loadOtp,
  verifyOtp,
  resendOtp,
  insertUser,
  login,
  loadforgetPassword,
  loadchangePassword,
  veryfyForgetPassword,
  loadnewPassword,
  veryfynewPassword,
  veryfyChangePassword,
  veryfyLogin,

  //#### products ######

  loadHome,
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
  changeEmail,
  verifychangeEmail,
  verifychangeEmailOtp,
  paginationAddress,
  
  //#### cart ######

  handleCart,
  loadCartt,
  updateCart,
  deleteCart,
  proceedCheckout,
  //##### order #####

  changeAddress,
  checkOut,
  test,
  coupens,
  test,
  errorpage,
  success,
  failed,
  about,
  contact,
  removeOutofStock,
  sort,
  paginationProduct,
  searchProduct,
  paginationCoupon,
  filterCoupon,
  searchCoupon,
};
