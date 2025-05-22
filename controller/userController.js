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
const nodemailer = require("nodemailer");
const walletModel = require("../model/walletModel");


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
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    // mail options
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: process.env.MY_EMAIL,
      subject: "Verify Your email",
      html: `Your OTP is: ${otp}`,
    };

    // hash ottp
    const saltRounds = 10;
    console.log(otp);
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOtpVerifivation = new UserOtpVerification({
      email: email,
      otp: hashedOTP,
    });

    await newOtpVerifivation.save();

    await transporter.sendMail(mailOptions);

    res.json({ success: true, email });
  } catch (error) {
    console.log(error.message);
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

const getStoreDataForUser = async(req,res)=>{
    try {
        const cartData = await CartDB.findOne({userId:req.session.user_id}).populate({
            path: 'products.productId',
            populate: { path: 'categoryID' }})
           
        const wishlistData = await WishlistDB.findOne({userId:req.session.user_id})
        const offerData = await OfferDB.find({});
        const  cartTotal = cartData.products.reduce((acc,value)=>{value
           const offer =  offerData.find( iteam => iteam.iteam === value.productId.name || iteam.iteam === value.productId.categoryID.name)
           if(offer){
             return acc+ value.productId.Price*value.quandity - Math.round(value.productId.Price*value.quandity * offer.offerRate/100)
           }else{
             return acc+value.productId.Price*value.quandity
           }
       },0);
        return {cartData,wishlistData,offerData,cartTotal}
    } catch (error) {
        console.error(error.message)
    }
} 

const veryfyForgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await userModel.findOne({ email: email });
    if (userData) {
      if (userData.is_verified == true) {
        const randomString = randomstring.generate();
        await userModel.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Reset Password Link is Sent to Your Mail",
        });
      } else {
        res.render("forget", { message: "Please Verify Your Email" });
      }
    } else {
      res.render("forget", { message: "User Email Not Found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const sendResetPasswordMail = async (name, email, token) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "pkansif39@gmail.com",
        pass: "tvtq zgcc skhn rliu",
      },
    });

    // mail options
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: process.env.MY_EMAIL,
      subject: "Reset Your Password",
      html: `Hi ${name} Pease ClickHere To :<a href="${process.env.BASE_URL}/forgetPassword?token=${token}">Forget</a> your password`,
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
    if (tokenData) {
      res.render("newPassword", { user_id: tokenData._id });
    } else {
      res.render("newPassword", { message: "token is invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const veryfynewPassword = async (req, res) => {
  try {
    const securepassword = await securePassword(req.body.password);
    if (req.body.password.length > 4) {
      if (req.body.password == req.body.repassword) {
        const userData = await userModel.findByIdAndUpdate(
          { _id: req.body.user_id },
          { $set: { password: securepassword, token: "" } }
        );
        await userData.save();
        res.redirect("/");
      } else {
        res.render("newPassword", { message: "confirm password not match" });
      }
    } else {
      res.render("newPassword", { message: "Please Enter a Strong Password" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const register = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    req.body.name = req.body.name.trim();
    if (/^[A-Za-z]+(?:[A-Za-z]+)?$/.test(req.body.name)) {
      if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
        const emailCheck = await userModel.findOne({ email: req.body.email });
        if (emailCheck) {
          res.json({ emailError: "Email Already Exists" });
          return;
        }
        const mobileLength = req.body.mobile.length;
        if (mobileLength !== 10) {
          res.json({ mobileError: "Mobile Number Should Be 10 Degit" });
          return;
        }
        const passLength = req.body.password.length;
        if (passLength < 8 || passLength > 20) {
          res.json({ passwordError: "Password Should be in between 8 - 20" });
          return;
        }
        req.session.user = {
          email: req.body.email,
          name: req.body.name,
          mobile: req.body.mobile,
          password: await securePassword(req.body.password),
          is_admin: 0,
          is_blocked: false,
          is_verified: false,
        };

        sendOTPverificationEmail(req.body.email, res);
      } else {
        res.json({ emailError: "Please Check Your Email Structure" });
        return;
      }
    } else {
      res.json({ nameError: "invalid name provide" });
      return;
    }
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
    // creating user
    const userData = new userModel({
      email: req.session.user.email,
      name: req.session.user.name,
      mobile: req.session.user.mobile,
      password: req.session.user.password,
      is_admin: req.session.user.is_admin,
      is_blocked: req.session.user.is_blocked,
      is_verified: true,
    });
    await userData.save();
    // creating cart
    const cart = new CartDB({
      userId: userData._id,
      products: [],
    });
    await cart.save();
    console.log( "cart ok");
    // creating wallet
    const wallet = new walletModel({
      userId: userData._id,
      Balance: 0,
      walletHistery: [],
    });

    await wallet.save();
    console.log( "wallet ok");
    // creating wishlist
    const wishlist = new WishlistDB({
      userId: userData._id,
      products: [],
    });
    await wishlist.save();
    console.log( "wishlist okjjj");
    // crete address
    const address = await AddressDB({
        userID: userData._id,
        address: [],
      });

      await address.save();
      console.log( "address ok");
    req.session.user_id = userData._id;
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.query;
    await UserOtpVerification.findOneAndDelete({ email: email });
    sendOTPverificationEmail(email, res);
  } catch (error) {
    console.log(error.message);
  }
};

const veryfyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await userModel.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_blocked == false) {
          if (userData.is_verified == true) {
            req.session.user_id = userData._id;
            res.redirect("/home");
          } else {
            res.render("login", { message: "you Are an Bloked User" });
          }
        } else {
          res.render("login", { message: "you Are an Bloked User" });
        }
      } else {
        res.render("login", { message: "Email or Password is incorrect" });
      }
    } else {
      res.render("login", { message: "User Not Found" });
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

const wcollection = async (req, res) => {
  try {
    
    let sort;
    const id = req.query.sort;
    
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

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

    if (id === "Defult Sort") {
     
      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      })
        .populate("categoryID")
        .lean()
        .sort(sort);
      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    } else if (id === "Sort by Price: low to high") {
      
      sort = { Price: 1 };
      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      })
        .populate("categoryID")
        .lean()
        .sort(sort)
        .exec();
      productData.sort((a, b) => a.Price - b.Price);
      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    } else if (id === "Sort by Price: high to low") {
      
      sort = { Price: -1 };
      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      })
        .populate("categoryID")
        .lean()
        .sort(sort)
        .exec();
      productData.sort((a, b) => b.Price - a.Price);
      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    } else if (id === "Sort by Name : A-Z") {
      
      sort = { name: 1 };

      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      })
        .populate("categoryID")
        .lean()
        .sort(sort);
      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    } else if (id === "Sort by Name : Z-A") {
      sort = { name: -1 };
   
      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      })
        .populate("categoryID")
        .lean()
        .sort(sort);
      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    } else {
      const productData = await ProductDB.find({
        is_listed: true,
        $or: [
          { name: { $regex: ".*" + search + ".*", $options: "i" } },
          {
            "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
          },
        ],
      }).populate("categoryID");

      res.render("wcollection", {
        productData: productData,
        wishlistData,
        offerData,
        cartTotal,
        cartData,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const mcollection = async (req, res) => {
  try {

    // let sort;
    // const id = req.query.sort;
    // let search = "";
    // if (req.query.search) {
    //   search = req.query.search;
    // }

    // const cartData = await CartDB.findOne({
    //   userId: req.session.user_id,
    // }).populate({
    //   path: "products.productId",
    //   populate: { path: "categoryID" },
    // });
    // const wishlistData = await WishlistDB.findOne({
    //   userId: req.session.user_id,
    // }).populate("products.productId");
    // const offerData = await OfferDB.find({});
    // let cartTotal = 0;
    // if (cartData) {
    //   cartTotal = cartData.products.reduce((acc, value) => {
    //     value;
    //     const offer = offerData.find(
    //       (iteam) =>
    //         iteam.iteam === value.productId.name ||
    //         iteam.iteam === value.productId.categoryID.name
    //     );
    //     if (offer) {
    //       return (
    //         acc +
    //         value.productId.Price * value.quandity -
    //         Math.round(
    //           (value.productId.Price * value.quandity * offer.offerRate) / 100
    //         )
    //       );
    //     } else {
    //       return acc + value.productId.Price * value.quandity;
    //     }
    //   }, 0);
    // }

    // if (id === "Defult Sort") {
    
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   }).populate("categoryID");
    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // } else if (id === "Sort by Price: low to high") {
    //   console.log("2");
    //   sort = { Price: 1 };
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   })
    //     .populate("categoryID")
    //     .lean()
    //     .sort(sort)
    //     .exec();
    //   productData.sort((a, b) => a.Price - b.Price);
    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // } else if (id === "Sort by Price: high to low") {
    //   console.log("3");
    //   sort = { Price: -1 };
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   })
    //     .populate("categoryID")
    //     .lean()
    //     .sort(sort)
    //     .exec();
    //   productData.sort((a, b) => b.Price - a.Price);
    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // } else if (id === "Sort by Name : A-Z") {
    //   console.log("4");
    //   sort = { name: 1 };
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   })
    //     .populate("categoryID")
    //     .lean()
    //     .sort(sort);
    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // } else if (id === "Sort by Name : Z-A") {
    //   console.log("5");
    //   sort = { name: -1 };
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   })
    //     .populate("categoryID")
    //     .lean()
    //     .sort(sort);
    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // } else {
    //   const productData = await ProductDB.find({
    //     is_listed: true,
    //     $or: [
    //       { name: { $regex: ".*" + search + ".*", $options: "i" } },
    //       {
    //         "categoryID.name": { $regex: ".*" + search + ".*", $options: "i" },
    //       },
    //     ],
    //   }).populate("categoryID");

    //   res.render("mcollection", {
    //     productData: productData,
    //     cartData,
    //     wishlistData,
    //     offerData,
    //     cartTotal,
    //   });
    // }
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
    }).populate("products.productId");
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
    const {sort,filter,page} = req.query;
    const sortQuery = {};
    const limit = 8;
    console.log(req.query)

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
      default:
         sortQuery.name=1
        break;
    }
    
    let data =  await ProductDB.find({is_listed:true}).sort(sortQuery).populate("categoryID");
    let products =  data.filter((val)=>{
      if(filter == "All" ){
         return val.categoryID.is_listed == true 
      }else{
        return val.categoryID.is_listed == true && val.categoryID.name == filter
      }
    });
  
    const totalPage = Math.ceil(products.length/limit);
    products =  products.slice((page-1)*limit,(limit*page));
    res.render('productGrid', { productData:products, offerData, wishlistData, cartData ,currentPage:page,totalPage});
 

 } catch (error) {
  console.error(error.message)
 }
}

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
    res.render("profile", {
      user: userData,
      cartData,
      wishlistData,
      cartTotal,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadedit = async (req, res) => {
  try {
    const userData = await userModel.findById({ _id: req.query.id });

    res.render("edit", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = await userModel.findOne({ _id: req.query.id });
    const emailCheck = await userModel.findOne({ email: req.body.email });
    if (!emailCheck) {
      if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
        if (req.body.mobile.length == 10) {
          const userData = await userModel.findByIdAndUpdate(
            { _id: req.query.id },
            {
              name: req.body.name,
              email: req.body.email,
              mobile: req.body.mobile,
            }
          );

          await userData.save();
          res.redirect("/profile");
        } else {
          const userData = await userModel.findById({ _id: req.query.id });
          res.render("edit", {
            user: userData,
            message: "mobile numbe shouldbe 10 digit",
          });
        }
      } else {
        const userData = await userModel.findById({ _id: req.query.id });
        res.render("edit", {
          user: userData,
          message: "Please Check The Structure Of your Email",
        });
      }
    } else if (data.email == req.body.email) {
      if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
        if (req.body.mobile.length == 10) {
          const userData = await userModel.findByIdAndUpdate(
            { _id: req.query.id },
            {
              name: req.body.name,
              email: req.body.email,
              mobile: req.body.mobile,
            }
          );

          await userData.save();
          res.redirect("/profile");
        } else {
          const userData = await userModel.findById({ _id: req.query.id });
          res.render("edit", {
            user: userData,
            message: "mobile numbe shouldbe 10 digit",
          });
        }
      } else {
        const userData = await userModel.findById({ _id: req.query.id });
        res.render("edit", {
          user: userData,
          message: "Please Check The Structure Of your Email",
        });
      }
    } else {
      const userData = await userModel.findById({ _id: req.query.id });
      res.render("edit", { user: userData, message: "user already exists" });
    }
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
    const exists = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");
    if (!exists) {
      const fname = req.body.fname.trim();
      const lname = req.body.lname.trim();
      const name = req.body.address.trim();
      if (/^[a-zA-Z]+$/.test(fname)) {
        if (/^[a-zA-Z]+$/.test(lname)) {
          if (/^[a-zA-Z\s]+$/.test(name)) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
              const address = await AddressDB({
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

              await address.save();

              res.redirect("/Addresses");
            } else {
              req.flash("msg4", "Check Your Email Structure");
              res.redirect("/addAddress");
            }
          } else {
            req.flash("msg3", "Invalid Address");
            res.redirect("/addAddress");
          }
        } else {
          req.flash("msg2", "Invalid Lname");
          res.redirect("/addAddress");
        }
      } else {
        req.flash("msg1", "Invalid Fname");
        res.redirect("/addAddress");
      }
    } else {
      const fname = req.body.fname.trim();
      const lname = req.body.lname.trim();
      const name = req.body.address.trim();
      if (/^[a-zA-Z]+$/.test(fname)) {
        if (/^[a-zA-Z]+$/.test(lname)) {
          if (/^[a-zA-Z\s]+$/.test(name)) {
            const checkAddress = exists.address.find(
              (address) =>
                address.fname == fname &&
                address.lname == lname &&
                address.address == name
            );
            if (!checkAddress) {
              if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
                const data = await AddressDB.findOneAndUpdate(
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
                res.redirect("/Addresses");
              } else {
                req.flash("msg4", "Check Your Email Structure");
                res.redirect("/addAddress");
              }
            } else {
              req.flash("msg3", "This Address Already Exist");
              res.redirect("/addAddress");
            }
          } else {
            req.flash("msg3", "Invalid Address");
            res.redirect("/addAddress");
          }
        } else {
          req.flash("msg2", "Invalid Lname");
          res.redirect("/addAddress");
        }
      } else {
        req.flash("msg1", "Invalid Fname");
        res.redirect("/addAddress");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddress = async (req, res) => {
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
    let page;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 2;
    const data = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await AddressDB.findOne({ userID: req.session.user_id })
      .populate("userID")
      .countDocuments();

    res.render("address", {
      addressData: data,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      cartData,
      wishlistData,
      offerData,
      cartTotal,
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
    const data = await AddressDB.findOne({ "address._id": req.query.id });

    const productUpdate = data.address.find((a) => {
      return a._id.equals(req.query.id);
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
    const data = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");

    const address = data.address.find((a) => {
      return a._id.equals(req.query.id);
    });
    const fname = req.body.fname.trim();
    const lname = req.body.lname.trim();
    const name = req.body.address.trim();
    if (/^[a-zA-Z]+$/.test(fname)) {
      if (/^[a-zA-Z]+$/.test(lname)) {
        if (/^[a-zA-Z\s]+$/.test(name)) {
          const checkAddress = data.address.find(
            (address) => address.address == req.body.address
          );
          if (address.address == req.body.address) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
              address.fname = req.body.fname;
              address.lname = req.body.lname;
              address.address = req.body.address;
              address.country = req.body.country;
              address.state = req.body.state;
              address.city = req.body.city;
              address.pincode = req.body.pincode;
              address.email = req.body.email;
              address.mobile = req.body.mobile;

              const x = await data.save();
              res.redirect("/addresses");
            } else {
              req.flash("msg4", "Check Your Email Structure");
              res.redirect(`/editAddress?id=${req.query.id}`);
            }
          } else if (!checkAddress) {
            if (/^[A-Za-z0-9.%+-]+@gmail\.com$/.test(req.body.email)) {
              address.fname = req.body.fname;
              address.lname = req.body.lname;
              address.address = req.body.address;
              address.country = req.body.country;
              address.state = req.body.state;
              address.city = req.body.city;
              address.pincode = req.body.pincode;
              address.email = req.body.email;
              address.mobile = req.body.mobile;

              const x = await data.save();
              res.redirect("/addresses");
            } else {
              req.flash("msg4", "Check Your Email Structure");
              res.redirect(`/editAddress?id=${req.query.id}`);
            }
          } else {
            req.flash("msg3", "Address Already Exists");
            res.redirect(`/editAddress?id=${req.query.id}`);
          }
        } else {
          req.flash("msg3", "Invalid Address");
          res.redirect(`/editAddress?id=${req.query.id}`);
        }
      } else {
        req.flash("msg2", "Invalid Lname");
        res.redirect(`/editAddress?id=${req.query.id}`);
      }
    } else {
      req.flash("msg1", "Invalid Fname");
      res.redirect(`/editAddress?id=${req.query.id}`);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeAddress = async (req, res) => {
  try {
    const { id } = req.query;
    console.log("hiii");
    console.log(id);
    const data = await AddressDB.findOneAndUpdate(
      { userID: req.session.user_id },
      { $pull: { address: { _id: id } } }
    );
    console.log(data);
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
    let wex = await CartDB.findOne({ userId: req.session.user_id})
    const check  = await CartDB.findOne({ userId: req.session.user_id,'products.productId':{$in:[productId]}})
    
    if(check){
      const newCart = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$pull:{'products':{
        productId:product._id,
        quandity:quantity,
       }}},{new:true}).populate("products.productId");
       const totel = newCart.products.reduce((totel,val)=>{
        return totel+(val.productId.Price*val.quandity)
       },0);
       res.json({ success: true,totel,count:newCart.products.length,removed:true });
    }else{
     
       const newCart = await CartDB.findOneAndUpdate({userId:req.session.user_id},{$push:{'products':{
        productId:product._id,
        quandity:quantity,
       }}},{new:true}).populate("products.productId");
       const totel = newCart.products.reduce((totel,val)=>{
        return totel+(val.productId.Price*val.quandity)
       },0);
       res.json({ success: true,totel,count:newCart.products.length,added:true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeOutofStock = async (req, res)=>{
  try {
    const newCart = await CartDB.findOneAndUpdate({userId:req.session.user_id}).populate("products.productId");
    console.log(newCart.products,"111111111111")
    newCart.products = newCart.products.filter((value)=>value.productId.stock>0)
    console.log(newCart.products)
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
    const { productId,  quandity } = req.query;
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

    const q = parseInt(quandity);
    productUpdate.quandity = q;

    let b = await cart.save();

    let total = b.products.reduce((acc, value) => {
      return acc + value.productId.Price * value.quandity;
    }, 0);

    const offer = offerData.find(
      (value) =>
        value &&
        (value.iteam === productUpdate.productId.name ||
          value.iteam === productUpdate.productId.categoryID.name)
    );

    if (offer) {
      const subTotal =
        total -
        Math.round((productUpdate.productId.Price * offer.offerRate) / 100) * q;
      const productTotal =
        (productUpdate.productId.Price -
          Math.round((productUpdate.productId.Price * offer.offerRate) / 100)) *
        q;
      res.status(200).json({ total: subTotal, productTotal: productTotal });
    } else {
      let subTotal = b.products.reduce((acc, valuee) => {
        const offer = offerData.find(
          (value) =>
            value &&
            (value.iteam === valuee.productId.name ||
              value.iteam === valuee.productId.categoryID.name)
        );
        var amount = 0;
        if (offer) {
          amount =
            Math.round((valuee.productId.Price * offer.offerRate) / 100) *
            valuee.quandity;
        }
        return acc + valuee.productId.Price * valuee.quandity - amount;
      }, 0);

      const productTotal = productUpdate.productId.Price * q;

      res.status(200).json({ productTotal: productTotal, total: subTotal });
    }
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
    
      const newprice = cart.products.reduce((acc, product) => {
        const offer = offerData.find(
          (value) =>
            value &&
            (value.iteam === product.productId.name ||
              value.iteam === product.productId.categoryID.name)
        );
        var amount = 0;
        if (offer) {
          amount =
            Math.round((product.productId.Price * offer.offerRate) / 100) *
            product.quandity;
        }
        return acc + product.productId.Price * product.quandity - amount;
      }, 0);
      res.status(200).json({ subTotal: newprice,totalProducts:cart.products.length });
   
  } catch (error) {
    console.log(error.message);
  }
};

//############### checkout ############
const checkOut = async (req, res) => {
  try {
    
    let cartData = await CartDB.findOne({
      userId: req.session.user_id,
    }).populate({
      path: "products.productId",
      populate: { path: "categoryID" },
    });
    
    const address = await AddressDB.findOne({
      userID: req.session.user_id,
    }).populate("userID");

    const wishlistData = await WishlistDB.findOne({
      userId: req.session.user_id,
    }).populate("products.productId");
    const offerData = await OfferDB.find({});
    

    offerData.offerRate / 100;
    let cartTotal = 0;
    
    if (cartData) {
      cartTotal = cartData.products.reduce((acc, value) => {
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
 
   
        res.render("checkout", {
          productData: cartData,
          addressData: address,
          offer:0,
          offerData: offerData,
          subTotal: cartTotal,
          cartData: cartData,
          wishlistData: wishlistData,
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
    const orderData = await OrderDB.findOne({ userId: req.session.user_id })
      .populate("userId")
      .populate("products.productId");
    const product = orderData.products.find((p) => {
      return p._id.equals(productId);
    });
    const date = new Date().toISOString().slice(0, 10);

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
        country: "INDIA",
      },
      // Your recipient
      client: {
        company: orderData.userId.name,
        address: product.deliveryAddress.address,
        zip: product.deliveryAddress.pincode,
        city: product.deliveryAddress.city,
        country: product.deliveryAddress.country,
      },
      information: {
        // Invoice data
        date: date,
        // Invoice due date
        // dueDate: "31-12-2021"
      },
      // The products you would like to see on your invoice
      // Total values are being calculated automatically
      products: [
        {
          quantity: product.quandity,
          description: product.productId.name,
          // taxRate: 6,
          price: product.productTotal * product.quandity,
        },
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
      const pdfBuffer = Buffer.from(result.pdf, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
      res.send(pdfBuffer);
    });
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
    const data = await CoupenDB.find({});
    res.render("coupens", {
      coupens: data,
      user: req.session.user_id,
      cartData,
      wishlistData,
      cartTotal,
    });
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
  veryfyForgetPassword,
  loadnewPassword,
  veryfynewPassword,
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

  //#### cart ######

  handleCart,
  loadCartt,
  updateCart,
  deleteCart,

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
  sort
};
