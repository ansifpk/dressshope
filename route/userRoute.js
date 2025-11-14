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

user_route.route("/register")
.all(auth.logoutUser)
.get(userControll.register)
.post(userControll.insertUser)

user_route.route("/otp")
.all(auth.logoutUser)
.get(userControll.loadOtp)
.post(userControll.verifyOtp)
user_route.post("/login",userControll.veryfyLogin);
user_route.get('/resend',auth.logoutUser,userControll.resendOtp)
user_route.get('/resendOTP',auth.loginUser,authBlock.blockUser,userControll.resendOtp)
user_route.get("/home",userControll.loadHome);

// ########################products##############################

user_route.get("/wcollection",productController.wcollection);
user_route.get("/mcollection",productController.mcollection);
user_route.get("/products",productController.loadProducts);
user_route.get("/changePage",auth.loginUser,authBlock.blockUser,productController.changePage);
user_route.get("/detailes",userControll.productsDetailes);
user_route.get("/sort",userControll.sort);
user_route.get("/paginationProduct",userControll.paginationProduct);
user_route.get("/searchProduct",userControll.searchProduct);

// ########################password##############################

user_route.route("/changePassword")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.loadchangePassword)
.post(userControll.veryfyChangePassword)

user_route.route("/forget")
.all(auth.logoutUser)
.get(userControll.loadforgetPassword)
.post(userControll.veryfyForgetPassword)

user_route.route("/forgetpassword")
.all(auth.logoutUser)
.get(userControll.loadnewPassword)
.post(userControll.veryfynewPassword)

user_route.get('/logout',auth.loginUser,authBlock.blockUser,userControll.userLogout);
user_route.get('/error',auth.loginUser,authBlock.blockUser,userControll.errorpage);

// ########################cart##############################

user_route.patch('/cart',auth.loginUser,authBlock.blockUser,userControll.handleCart);
user_route.patch('/removeOutofStock',auth.loginUser,authBlock.blockUser,userControll.removeOutofStock);
user_route.get('/cartt',auth.loginUser,authBlock.blockUser,userControll.loadCartt);
user_route.patch('/updateCart',auth.loginUser,authBlock.blockUser,userControll.updateCart);
user_route.get('/deleteCart',auth.loginUser,authBlock.blockUser,userControll.deleteCart);
user_route.get('/proceedCheckout',auth.loginUser,authBlock.blockUser,userControll.proceedCheckout);

// ########################checkout##############################

user_route.route("/checkout")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.checkOut)
.post(userControll.changeAddress)

// ########################address##############################

user_route.route("/addAddress")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.addAddress)
.patch(userControll.saveAddress)

user_route.route("/editAddress")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.loadeditAddress)
.patch(userControll.veryfyAddress)

user_route.get('/Addresses',auth.loginUser,authBlock.blockUser,userControll.loadAddress);
user_route.get('/deleteAddress',auth.loginUser,authBlock.blockUser,userControll.removeAddress);
user_route.get('/paginationAddress',auth.loginUser,authBlock.blockUser,userControll.paginationAddress);
// ########################profile##############################

user_route.get('/profile',auth.loginUser,authBlock.blockUser,userControll.profile);
user_route.route("/edit")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.loadedit)
.patch(userControll.updateProfile)
user_route.route("/changeEmail")
.all(auth.loginUser,authBlock.blockUser)
.get(userControll.changeEmail)
.patch(userControll.verifychangeEmail)

user_route.delete('/verifychangeEmailOtp',auth.loginUser,authBlock.blockUser,userControll.verifychangeEmailOtp);

// ########################order############################## 

user_route.route("/orders")
.all(auth.loginUser,authBlock.blockUser)
.get(orderController.order)
.post(orderController.placeOrder)

user_route.get('/orderDetailes',auth.loginUser,authBlock.blockUser,orderController.orderUserDetailes);
user_route.patch('/cancelOrder',auth.loginUser,authBlock.blockUser,orderController.cancelUserOrder);
user_route.patch('/cancelAllOrder',auth.loginUser,authBlock.blockUser,orderController.cancelAllProductInOrder);
user_route.patch('/returnOrder',auth.loginUser,authBlock.blockUser,orderController.returnOrder);
user_route.patch('/returnAllOrder',auth.loginUser,authBlock.blockUser,orderController.returnAllOrder);
user_route.get('/payAgain',auth.loginUser,authBlock.blockUser,orderController.payAgain);
user_route.get('/payAgainAll',auth.loginUser,authBlock.blockUser,orderController.payAgainAll);
user_route.post('/savePayAgain',orderController.savePayAgain);
user_route.post('/savePayAgainAll',auth.loginUser,authBlock.blockUser,orderController.savePayAgainAll);
user_route.get('/wallet',auth.loginUser,authBlock.blockUser,orderController.wallet);
user_route.get('/successPage',auth.loginUser,authBlock.blockUser,orderController.successPage);
user_route.post('/saveOrder',auth.loginUser,authBlock.blockUser,orderController.saveOrder);
user_route.get('/failePage',auth.loginUser,authBlock.blockUser,orderController.failePage);
user_route.get('/paginationOrder',auth.loginUser,authBlock.blockUser,orderController.paginationUserOrder);

// ######################## wishlist ##############################

user_route.route("/wishlist")
.all(auth.loginUser,authBlock.blockUser)
.get(wishlistController.wishlist)
.patch(wishlistController.handleWishlist)

user_route.get('/coupens',auth.loginUser,authBlock.blockUser,userControll.coupens);
user_route.get('/searchCoupon',auth.loginUser,authBlock.blockUser,userControll.searchCoupon);
user_route.get('/filterCoupon',auth.loginUser,authBlock.blockUser,userControll.filterCoupon);
user_route.get('/paginationCoupon',auth.loginUser,authBlock.blockUser,userControll.paginationCoupon);
user_route.post('/applyCoupon',auth.loginUser,authBlock.blockUser,couponController.applyCoupon);
user_route.get('/about',auth.loginUser,authBlock.blockUser,userControll.about);
user_route.get('/contact',auth.loginUser,authBlock.blockUser,userControll.contact);
user_route.get('/test',userControll.test);
module.exports=user_route;