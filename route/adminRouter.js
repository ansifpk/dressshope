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
     
        cb(null,path.join(__dirname,'../public/admin/assets/productImages'));
       
    },
    filename:function(req,file,cb){
     const name =`${Date.now()} ${file.originalname}`
     cb(null,name);
    }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};


const upload = multer({storage:storage,fileFilter:imageFilter});


adminRouter.set('views','./views/admin')

//################### admin ##########################

adminRouter.get('/',authadmin.logoutAdmin,adminController.adminLogin)
adminRouter.post('/',authadmin.logoutAdmin,adminController.veryfyLogin)
adminRouter.get('/dashboard',authadmin.loginAdmin,adminController.dashboard);
adminRouter.get('/changeDateDashboard',authadmin.loginAdmin,adminController.changeDateDashboard);
adminRouter.get('/filterDashboard',adminController.filterDashboard);
adminRouter.get('/changeChart',authadmin.loginAdmin,adminController.chart);
adminRouter.get('/logout',authadmin.loginAdmin,adminController.adminLogout);


//################### user ##########################

adminRouter.get('/viewUser',authadmin.loginAdmin,adminController.viewUser);
adminRouter.patch('/blockUser',authadmin.loginAdmin,adminController.blockUser);
adminRouter.get('/addUser',authadmin.loginAdmin,adminController.loadaddUser)
adminRouter.post('/addUser',adminController.addUser);
adminRouter.get('/sortUser',adminController.sortUser);
adminRouter.get('/searchrUser',adminController.searchrUser);
adminRouter.get('/userPagination',adminController.userPagination);

//################### products ##########################

adminRouter.get('/viewProducts',authadmin.loginAdmin,productController.viewProducts)
adminRouter.get('/addProducts',authadmin.loginAdmin,productController.loadaddProducts)
adminRouter.post('/addProducts',authadmin.loginAdmin,upload.fields([{name:"file-upload0",maxCount:1},{name:"file-upload1",maxCount:1},{name:"file-upload2",maxCount:1},{name:"file-upload3",maxCount:1}]),productController.addProducts)
adminRouter.get('/editProducts',authadmin.loginAdmin,productController.editProducts)
adminRouter.patch('/editProducts',authadmin.loginAdmin,upload.fields([{name:"file-upload0",maxCount:1},{name:"file-upload1",maxCount:1},{name:"file-upload2",maxCount:1},{name:"file-upload3",maxCount:1}]),productController.UpdateProducts)
adminRouter.patch('/listProducts',authadmin.loginAdmin,productController.listProduct);
adminRouter.get('/searchProduct',authadmin.loginAdmin,productController.searchProduct);
adminRouter.get('/paginationProduct',authadmin.loginAdmin,productController.paginationProduct);
adminRouter.get('/filterAndsortProduct',authadmin.loginAdmin,productController.filterAndsortProduct);


//################### category ##########################

adminRouter.get('/category',authadmin.loginAdmin,categoryController.category)
adminRouter.patch('/category',authadmin.loginAdmin,categoryController.listcategory)
adminRouter.get('/addcategory',authadmin.loginAdmin,categoryController.loadaddcategory) 
adminRouter.post('/addcategory',categoryController.addcategory) 
adminRouter.get('/editCategory',authadmin.loginAdmin,categoryController.loadeditcategory)
adminRouter.patch('/editCategory',authadmin.loginAdmin,categoryController.editcategory);
adminRouter.get('/searchCategory',authadmin.loginAdmin,categoryController.searchCategory);
adminRouter.get('/filterAndsortCategory',authadmin.loginAdmin,categoryController.filterAndsortCategory);
adminRouter.get('/categoryPagination',authadmin.loginAdmin,categoryController.categoryPagination);

//################### order ##########################

adminRouter.get('/ordersList',authadmin.loginAdmin,orderController.ordersList)
adminRouter.get('/orderDetailes',authadmin.loginAdmin,orderController.orderDetailes)
adminRouter.patch('/orderStatus',authadmin.loginAdmin,orderController.orderStatus)
adminRouter.patch('/returnOrder',authadmin.loginAdmin,orderController.adminReturnOrder)
adminRouter.get('/filterAndsortOrders',authadmin.loginAdmin,orderController.filterAndsortOrders)
adminRouter.get('/ordersPagination',authadmin.loginAdmin,orderController.paginationOrders)
adminRouter.get('/searchOrders',authadmin.loginAdmin,orderController.searchOrders)

//############### cuppen #######################################

adminRouter.get('/coupons',authadmin.loginAdmin,couponController.coupons)
adminRouter.get('/addCoupon',authadmin.loginAdmin,couponController.loadaddCoupons)
adminRouter.post('/addCoupon',upload.single('file'),authadmin.loginAdmin,couponController.addCuppen)
adminRouter.get('/editCoupon',authadmin.loginAdmin,couponController.loadeditCuppen)
adminRouter.patch('/editCoupon',upload.single('file'),authadmin.loginAdmin,couponController.editCuppen)
adminRouter.delete('/coupon',authadmin.loginAdmin,couponController.deleteCoupen)
adminRouter.get('/searchCoupon',authadmin.loginAdmin,couponController.searchCoupon)
adminRouter.get('/filterAndsortCoupon',authadmin.loginAdmin,couponController.filterAndsortCoupon)
adminRouter.get('/couponPagination',authadmin.loginAdmin,couponController.couponPagination)

//############# addOffer #################################

adminRouter.get('/offer',authadmin.loginAdmin,offerController.offer)
adminRouter.get('/addOffer',authadmin.loginAdmin,offerController.loadaddOffer)
adminRouter.post('/addOffer',authadmin.loginAdmin,offerController.verifyOffer)
adminRouter.delete('/offer',authadmin.loginAdmin,offerController.deleteOffer)
adminRouter.get('/selectOffer',authadmin.loginAdmin,offerController.selectOffer)
adminRouter.get('/referalOffer',authadmin.loginAdmin,offerController.referalOffer)
adminRouter.post('/referalOffer',authadmin.loginAdmin,offerController.createReferalOffer)
adminRouter.patch('/referalOffer',authadmin.loginAdmin,offerController.editReferalOffer)
adminRouter.delete('/referalOffer',authadmin.loginAdmin,offerController.deleteReferalOffer)

// ###########  Report #################################

adminRouter.get('/createReport',authadmin.loginAdmin,reportController.createReport)
adminRouter.get('/createReportPdf',authadmin.loginAdmin,reportController.createReportPdf)
adminRouter.get('/orderReport',authadmin.loginAdmin,reportController.orderReport)
adminRouter.get('/dateChange',authadmin.loginAdmin,reportController.dateChange)
module.exports=adminRouter;