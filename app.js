const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URL);
const nocahe = require('nocache')
const express = require("express");
const path = require("path");
const app = express();
const flash = require("connect-flash");

const session = require('express-session');

app.use(session({secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:true}))

app.set("view engine","ejs");
app.set("views",'./views/users');
app.set("views",'./views/admin');
app.set("views",'./views/layout');


app.use(nocahe())
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
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