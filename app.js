const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/user_system');
require('dotenv').config();
const nocahe = require('nocache')
const express = require("express");
const path = require("path");
const app = express();

const session = require('express-session');

app.use(session({secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:true}))

app.set("view engine","ejs");
app.set("views",'./views/users');
app.set("views",'./views/admin');


app.use(nocahe())
app.use(express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname,"public/assets")));
// for user route 
const userRoute = require('./route/uderRoute')
app.use('/',userRoute)
const adminRouter = require('./route/adminRouter')
app.use('/admin',adminRouter)




 
 
 
// app.get('/detailes',(req,res)=>{
//     res.render("detailes")
//  })

 
// app.get('/about',(req,res)=>{
//     res.render("about")
//  })

 
// app.get('/contact',(req,res)=>{
//     res.render("contact")
//  })
 
// app.get('/wcollection',(req,res)=>{
//     res.render("wcollection")
//  })

// app.get('/mcollection',(req,res)=>{
//     res.render("mcollection")
//  })
 
app.listen(3000,()=>{
    console.log("starrt")
})