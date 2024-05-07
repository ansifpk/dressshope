const express = require('express');
const adminRouter = express();
const bodyParser = require('body-parser')
const adminController = require('../controller/adminController');
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

// const productController = require('../controller/productController')
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

adminRouter.get('/viewProducts',authadmin.loginAdmin,adminController.viewProducts)
adminRouter.get('/addProducts',authadmin.loginAdmin,adminController.loadaddProducts)
adminRouter.post('/addProducts',upload.array('file'),adminController.addProducts)
adminRouter.get('/editProducts',authadmin.loginAdmin,adminController.editProducts)
adminRouter.post('/editProducts',upload.array('file'),adminController.UpdateProducts)
adminRouter.get('/listProducts',authadmin.loginAdmin,adminController.listProduct);

//################### category ##########################

adminRouter.get('/category',authadmin.loginAdmin,adminController.category)
adminRouter.get('/addcategory',authadmin.loginAdmin,adminController.loadaddcategory) 
adminRouter.post('/addcategory',adminController.addcategory) 
adminRouter.get('/editCategory',authadmin.loginAdmin,adminController.loadeditcategory)
adminRouter.post('/editCategory',adminController.editcategory);
adminRouter.get('/listCategory',authadmin.loginAdmin,adminController.listcategory)

//################### category ##########################

adminRouter.get('/ordersList',authadmin.loginAdmin,adminController.ordersList)
adminRouter.get('/viewOrder',authadmin.loginAdmin,adminController.viewOrders)
adminRouter.get('/orderDetailes',authadmin.loginAdmin,adminController.orderDetailes)
adminRouter.get('/editOrders',authadmin.loginAdmin,adminController.editOrders)
adminRouter.get('/cancelOrder',authadmin.loginAdmin,adminController.cancelOrder)
adminRouter.get('/orderStatus',authadmin.loginAdmin,adminController.orderStatus)
adminRouter.get('/createReport',adminController.createReport)
adminRouter.get('/createReportPdf',adminController.createReportPdf)
//############### cuppen #######################################

adminRouter.get('/coupens',authadmin.loginAdmin,adminController.coupens)
adminRouter.get('/addCuppen',authadmin.loginAdmin,adminController.loadaddCuppen)
adminRouter.post('/addCuppen',upload.single('file'),authadmin.loginAdmin,adminController.addCuppen)
adminRouter.get('/editCoupen',authadmin.loginAdmin,adminController.loadeditCuppen)
adminRouter.post('/editCoupen',upload.single('file'),authadmin.loginAdmin,adminController.editCuppen)
adminRouter.get('/deleteCoupen',authadmin.loginAdmin,adminController.deleteCoupen)

//############# addOffer #################################

adminRouter.get('/offer',authadmin.loginAdmin,adminController.offer)
adminRouter.get('/addOffer',authadmin.loginAdmin,adminController.loadaddOffer)
adminRouter.post('/addOffer',adminController.verifyOffer)
adminRouter.get('/deleteOffer',authadmin.loginAdmin,adminController.deleteOffer)
adminRouter.get('/weaklyReport',authadmin.loginAdmin,adminController.weaklyReport)
adminRouter.get('/monthlyReport',authadmin.loginAdmin,adminController.monthlyReport)
adminRouter.get('/yearlyReport',authadmin.loginAdmin,adminController.yearlyReport)
module.exports=adminRouter;