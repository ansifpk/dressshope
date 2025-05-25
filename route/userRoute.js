const express = require ("express")
const user_route = express();
const couponController = require('../controller/couponController');
const passport = require('passport');
require('../passport');
user_route.use(passport.initialize())
user_route.use(passport.session())

const bodyParser = require('body-parser');
const auth = require('../middleware/userauth');
const authBlock = require('../middleware/blockUser');
user_route.set("view engine","ejs");
user_route.set("views",'./views/users');


user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}));


const userControll = require("../controller/userController");
const productController = require("../controller/productController");
const orderController = require('../controller/orderController');
const wishlistController = require('../controller/wishlistController');
const { body } = require("express-validator");


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
user_route.get("/failed",auth.loginUser,authBlock.blockUser,userControll.failed);

// ########################login&register##############################

user_route.get("/register",auth.logoutUser,userControll.register);
user_route.post("/register",userControll.insertUser);
user_route.get('/otp',auth.logoutUser,userControll.loadOtp);
user_route.post('/otp',userControll.verifyOtp);
user_route.post("/login",userControll.veryfyLogin);
user_route.get('/resend',auth.logoutUser,userControll.resendOtp)
user_route.get("/home",auth.loginUser,authBlock.blockUser,userControll.loadHome);

// ########################products##############################

user_route.get("/wcollection",auth.loginUser,authBlock.blockUser,productController.wcollection);
user_route.get("/mcollection",auth.loginUser,authBlock.blockUser,productController.mcollection);
user_route.get("/products",auth.loginUser,authBlock.blockUser,productController.loadProducts);
user_route.get("/changePage",auth.loginUser,authBlock.blockUser,productController.changePage);
user_route.get("/detailes",auth.loginUser,authBlock.blockUser,userControll.productsDetailes);
user_route.get("/sort",auth.loginUser,authBlock.blockUser,userControll.sort);

// ########################password##############################

user_route.get("/changePassword",auth.loginUser,authBlock.blockUser,userControll.loadchangePassword);
user_route.post("/changePassword",auth.loginUser,authBlock.blockUser,userControll.veryfyChangePassword);
user_route.get("/forget",userControll.loadforgetPassword);
user_route.post("/forget",userControll.veryfyForgetPassword);
user_route.get("/forgetpassword",userControll.loadnewPassword);
user_route.post("/forgetpassword",userControll.veryfynewPassword);

user_route.get('/logout',auth.loginUser,authBlock.blockUser,userControll.userLogout);
user_route.get('/error',auth.loginUser,authBlock.blockUser,userControll.errorpage);

// ########################cart##############################

user_route.patch('/cart',auth.loginUser,authBlock.blockUser,userControll.handleCart);
user_route.patch('/removeOutofStock',auth.loginUser,authBlock.blockUser,userControll.removeOutofStock);
user_route.get('/cartt',auth.loginUser,authBlock.blockUser,userControll.loadCartt);
user_route.get('/updateCart',auth.loginUser,authBlock.blockUser,userControll.updateCart);
user_route.get('/deleteCart',auth.loginUser,authBlock.blockUser,userControll.deleteCart);

// ########################checkout##############################

user_route.get('/checkout',auth.loginUser,authBlock.blockUser,userControll.checkOut);
user_route.post('/checkout',auth.loginUser,authBlock.blockUser,userControll.changeAddress);

// ########################address##############################

user_route.get('/addAddress',auth.loginUser,authBlock.blockUser,userControll.addAddress);
user_route.post('/addAddress',auth.loginUser,authBlock.blockUser,userControll.saveAddress);
user_route.get('/Addresses',auth.loginUser,authBlock.blockUser,userControll.loadAddress);
user_route.get('/editAddress',auth.loginUser,authBlock.blockUser,userControll.loadeditAddress);
user_route.post('/editAddress',auth.loginUser,authBlock.blockUser,userControll.veryfyAddress);
user_route.get('/deleteAddress',auth.loginUser,authBlock.blockUser,userControll.removeAddress);
// ########################profile##############################

user_route.get('/profile',auth.loginUser,authBlock.blockUser,userControll.profile);
user_route.get('/edit',auth.loginUser,authBlock.blockUser,userControll.loadedit);
user_route.post('/edit',auth.loginUser,authBlock.blockUser,userControll.updateProfile);

// ########################order##############################

user_route.get('/orders',auth.loginUser,authBlock.blockUser,orderController.order);
user_route.post('/orders',auth.loginUser,authBlock.blockUser,orderController.placeOrder);
user_route.get('/orderDetailes',auth.loginUser,authBlock.blockUser,orderController.orderUserDetailes);
user_route.get('/cancelOrder',auth.loginUser,authBlock.blockUser,orderController.cancelUserOrder);
user_route.get('/returnOrder',auth.loginUser,authBlock.blockUser,orderController.returnOrder);
user_route.get('/payAgain',auth.loginUser,authBlock.blockUser,orderController.payAgain);
user_route.get('/repay',auth.loginUser,authBlock.blockUser,orderController.repay);
user_route.get('/wallet',auth.loginUser,authBlock.blockUser,orderController.wallet);
user_route.get('/successPage',auth.loginUser,authBlock.blockUser,orderController.successPage);
user_route.post('/saveOrder',auth.loginUser,authBlock.blockUser,orderController.saveOrder);
user_route.get('/failePage',auth.loginUser,authBlock.blockUser,orderController.failePage);

// ######################## wishlist ##############################

user_route.get('/wishlist',auth.loginUser,authBlock.blockUser,wishlistController.wishlist);
user_route.patch('/wishlist',auth.loginUser,authBlock.blockUser,wishlistController.handleWishlist);
user_route.get('/coupens',auth.loginUser,authBlock.blockUser,userControll.coupens);
user_route.post('/applyCoupon',auth.loginUser,authBlock.blockUser,couponController.applyCoupon);

user_route.get('/about',auth.loginUser,authBlock.blockUser,userControll.about);
user_route.get('/contact',auth.loginUser,authBlock.blockUser,userControll.contact);

user_route.get('/test',auth.loginUser,authBlock.blockUser,userControll.test);

module.exports=user_route;