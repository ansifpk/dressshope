const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/user_system');
require('dotenv').config();
const nocahe = require('nocache')
const express = require("express");
const path = require("path");
const app = express();

const session = require('express-session');
// console.log('client id',process.env.CLIENT_ID);
// console.log('secret',process.env.CLIENT_SECRET);
app.use(session({secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:true}))

app.set("view engine","ejs");
app.set("views",'./views/users');
app.set("views",'./views/admin');


app.use(nocahe())
app.use(express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname,"public/assets")));
// for user route 
const userRoute = require('./route/userRoute')
app.use('/',userRoute)
const adminRouter = require('./route/adminRouter')
app.use('/admin',adminRouter)

app.listen(3000,()=>{
    console.log("starrt")
})