const express = require ("express")
const user_route = express();

const passport = require('passport');
require('../passport');
user_route.use(passport.initialize())
user_route.use(passport.session())

const bodyParser = require('body-parser');
const nodemailer = require('nodemailer')
const auth = require('../middleware/userauth');
const authBlock = require('../middleware/blockUser');
user_route.set("view engine","ejs");
user_route.set("views",'./views/users');

user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}));


const userControll = require("../controller/userController")

// ########################google##############################

//auth
user_route.get('/auth/google',auth.logoutUser,passport.authenticate('google',{ scope:
   ['email','profile']
}));
//auth Callback
user_route.get('/auth/google/callback',auth.logoutUser,
   passport.authenticate('google',{
     successRedirect:'/success',
     failureRedirect:'/failed'
   })
);

user_route.get("/",auth.logoutUser,userControll.login);
user_route.get("/success",auth.logoutUser,userControll.success);
user_route.get("/failed",auth.loginUser,userControll.failed);

// ########################login&register##############################

user_route.get("/register",auth.logoutUser,userControll.register);
user_route.post("/register",userControll.insertUser);
user_route.get('/otp',auth.logoutUser,userControll.loadOtp);
user_route.post('/otp',userControll.verifyOtp);
user_route.post("/login",userControll.veryfyLogin);
user_route.get('/resend',auth.logoutUser,userControll.resendOtp)
user_route.get("/home",auth.loginUser,authBlock.blockUser,userControll.loadHome);

// ########################products##############################

user_route.get("/wcollection",auth.loginUser,authBlock.blockUser,userControll.wcollection);
user_route.get("/mcollection",auth.loginUser,authBlock.blockUser,userControll.mcollection);
user_route.get("/products",auth.loginUser,authBlock.blockUser,userControll.loadProducts);
user_route.get("/sort/:id",auth.loginUser,userControll.sort);
user_route.get("/detailes",auth.loginUser,authBlock.blockUser,userControll.productsDetailes);

// ########################password##############################

user_route.get("/forget",auth.loginUser,authBlock.blockUser,userControll.loadforgetPassword);
user_route.post("/forget",userControll.veryfyForgetPassword);
user_route.get("/forgetpassword",authBlock.blockUser,userControll.loadnewPassword);
user_route.post("/forgetpassword",userControll.veryfynewPassword);

user_route.get('/logout',auth.loginUser,authBlock.blockUser,userControll.userLogout);
user_route.get('/error',auth.loginUser,authBlock.blockUser,userControll.errorpage);

// ########################cart##############################
user_route.get('/addToCart',auth.loginUser,authBlock.blockUser,userControll.addToCart);
user_route.get('/cartt',auth.loginUser,authBlock.blockUser,userControll.loadCartt);
user_route.get('/updateCart',auth.loginUser,authBlock.blockUser,userControll.updateCart);
user_route.get('/deleteCart',auth.loginUser,authBlock.blockUser,userControll.deleteCart);

// ########################checkout##############################

user_route.get('/checkout',authBlock.blockUser,auth.loginUser,userControll.checkOut);
user_route.post('/checkout',userControll.changeAddress);
// ########################address##############################

user_route.get('/addAddress',authBlock.blockUser,auth.loginUser,userControll.addAddress);
user_route.post('/addAddress',userControll.saveAddress);
user_route.get('/Addresses',authBlock.blockUser,auth.loginUser,userControll.loadAddress);
user_route.get('/editAddress',auth.loginUser,authBlock.blockUser,userControll.loadeditAddress);
user_route.post('/editAddress',userControll.veryfyAddress);
user_route.get('/deleteAddress',auth.loginUser,authBlock.blockUser,userControll.removeAddress);
// ########################profile##############################

user_route.get('/profile',auth.loginUser,authBlock.blockUser,userControll.profile);
user_route.get('/edit',auth.loginUser,authBlock.blockUser,userControll.loadedit);
user_route.post('/edit',userControll.updateProfile);

// ########################order##############################

user_route.get('/orders',auth.loginUser,authBlock.blockUser,userControll.order);
user_route.get('/placeOrder',auth.loginUser,authBlock.blockUser,userControll.placeOrder);
user_route.get('/orderDetailes',auth.loginUser,authBlock.blockUser,userControll.orderDetailes);
user_route.get('/cancelOrder',auth.loginUser,authBlock.blockUser,userControll.cancelOrder);
user_route.get('/returnOrder',auth.loginUser,authBlock.blockUser,userControll.returnOrder);
user_route.get('/payAgain',auth.loginUser,authBlock.blockUser,userControll.payAgain);
user_route.get('/repay',auth.loginUser,authBlock.blockUser,userControll.repay);
user_route.get('/wallet',auth.loginUser,authBlock.blockUser,userControll.wallet);

// ########################order##############################

user_route.get('/wishlist',auth.loginUser,authBlock.blockUser,userControll.wishlist);
user_route.get('/addwishlist',auth.loginUser,authBlock.blockUser,userControll.addwishlist);
user_route.get('/deletewishlist',auth.loginUser,authBlock.blockUser,userControll.deletewishlist);
user_route.get('/coupens',auth.loginUser,authBlock.blockUser,userControll.coupens);
user_route.get('/successPage',userControll.successPage);
user_route.get('/failedPage',userControll.failePage);

user_route.get('/test',auth.loginUser,authBlock.blockUser,userControll.test);
module.exports=user_route;