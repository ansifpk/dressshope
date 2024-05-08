const express = require('express');
const adminRouter = express();
const bodyParser = require('body-parser')
const adminController = require('../controller/adminController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const orderController = require('../controller/orderController');
const offerController = require('../controller/offerController');
const reportController = require('../controller/reportController');
const couponController = require('../controller/couponController');
const authadmin = require('../middleware/adminauth');
const session = require('express-session');
const config = require('../config/config')
adminRouter.use(session({secret:config.sessionSecret,resave:false,saveUninitialized:true}))
adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}))
const multer = require('multer');
const randomstring = require('randomstring');

const path = require('path');


const storage = multer.diskStorage({
    destination:function(req,file,cb){
     
        cb(null,path.join(__dirname,'../public/admin/assets/productimages'));
       
    },
    filename:function(req,file,cb){
     const name =`${Date.now()} ${file.originalname}`
     cb(null,name);
    }
});

const upload = multer({storage:storage});


adminRouter.set('views','./views/admin')

//################### admin ##########################

adminRouter.get('/',authadmin.logoutAdmin,adminController.adminLogin)
adminRouter.post('/',adminController.veryfyLogin)
adminRouter.get('/dashboard',authadmin.loginAdmin,adminController.dashboard);
adminRouter.get('/changeChart',authadmin.loginAdmin,adminController.chart);
adminRouter.get('/logout',authadmin.loginAdmin,adminController.adminLogout);


//################### user ##########################

adminRouter.get('/viewUser',authadmin.loginAdmin,adminController.viewUser);
adminRouter.get('/blockUser',authadmin.loginAdmin,adminController.blockUser);
adminRouter.get('/addUser',authadmin.loginAdmin,adminController.loadaddUser)
adminRouter.post('/addUser',adminController.addUser);

//################### products ##########################

adminRouter.get('/viewProducts',authadmin.loginAdmin,productController.viewProducts)
adminRouter.get('/addProducts',authadmin.loginAdmin,productController.loadaddProducts)
adminRouter.post('/addProducts',upload.array('file'),productController.addProducts)
adminRouter.get('/editProducts',authadmin.loginAdmin,productController.editProducts)
adminRouter.post('/editProducts',upload.array('file'),productController.UpdateProducts)
adminRouter.get('/listProducts',authadmin.loginAdmin,productController.listProduct);

//################### category ##########################

adminRouter.get('/category',authadmin.loginAdmin,categoryController.category)
adminRouter.get('/addcategory',authadmin.loginAdmin,categoryController.loadaddcategory) 
adminRouter.post('/addcategory',categoryController.addcategory) 
adminRouter.get('/editCategory',authadmin.loginAdmin,categoryController.loadeditcategory)
adminRouter.post('/editCategory',categoryController.editcategory);
adminRouter.get('/listCategory',authadmin.loginAdmin,categoryController.listcategory)

//################### order ##########################

adminRouter.get('/ordersList',authadmin.loginAdmin,orderController.ordersList)
adminRouter.get('/viewOrder',authadmin.loginAdmin,orderController.viewOrders)
adminRouter.get('/orderDetailes',authadmin.loginAdmin,orderController.orderDetailes)
adminRouter.get('/editOrders',authadmin.loginAdmin,orderController.editOrders)
adminRouter.get('/cancelOrder',authadmin.loginAdmin,orderController.cancelOrder)
adminRouter.get('/orderStatus',authadmin.loginAdmin,orderController.orderStatus)

//############### cuppen #######################################

adminRouter.get('/coupens',authadmin.loginAdmin,couponController.coupens)
adminRouter.get('/addCuppen',authadmin.loginAdmin,couponController.loadaddCuppen)
adminRouter.post('/addCuppen',upload.single('file'),authadmin.loginAdmin,couponController.addCuppen)
adminRouter.get('/editCoupen',authadmin.loginAdmin,couponController.loadeditCuppen)
adminRouter.post('/editCoupen',upload.single('file'),authadmin.loginAdmin,couponController.editCuppen)
adminRouter.get('/deleteCoupen',authadmin.loginAdmin,couponController.deleteCoupen)

//############# addOffer #################################

adminRouter.get('/offer',authadmin.loginAdmin,offerController.offer)
adminRouter.get('/addOffer',authadmin.loginAdmin,offerController.loadaddOffer)
adminRouter.post('/addOffer',offerController.verifyOffer)
adminRouter.get('/deleteOffer',authadmin.loginAdmin,offerController.deleteOffer)

// ###########  Report #################################

adminRouter.get('/createReport',reportController.createReport)
adminRouter.get('/createReportPdf',reportController.createReportPdf)
adminRouter.get('/weaklyReport',authadmin.loginAdmin,reportController.weaklyReport)
adminRouter.get('/monthlyReport',authadmin.loginAdmin,reportController.monthlyReport)
adminRouter.get('/yearlyReport',authadmin.loginAdmin,reportController.yearlyReport)
module.exports=adminRouter;