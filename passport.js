// const passport = require('passport');
// require('dotenv').config();
// const GoogleStrategy = require('passport-google-oauth2').Strategy;

// passport.serializeUser((user,done)=>{
//     done(null,user);
// })

// passport.deserializeUser((user,done)=>{
//     done(null,user)
// });

// passport.use(new GoogleStrategy({
//     clientID:process.env.CLIENT_ID,
//     clientSecret:process.env.CLIENT_SECRET,
//     callbackURL:"http://localhost:3000/auth/google/callback",
//     passReqToCallback:true
// },
// function(request , accessToken , refreshToken , profile, done){
//  return done(null,profile);
// }) );
const passport = require('passport');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth2').Strategy;

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    throw new Error('Google OAuth2 client ID and client secret are required.');
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
}, function (request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));
