require('dotenv').config();
const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose=require("mongoose");
const app = express();
// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
// Set EJS engine
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const Bus=require("./models/busmodel");
const buses=require("./init/data");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const cookieparser=require("cookie-parser");
const flash=require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User=require("./models/usermodel");
const {islogin}=require("./middleware");
const Book=require("./models/bookingmodel")
const QRCode = require("qrcode");
const Busw = require("./models/busmodel");
const listingcontrollers=require("./controllers/listing.js");
var methodOverride = require('method-override')
app.use(methodOverride('_method'))

const db_url=process.env.MONGODB_URI;
main()
.then(()=>{
  console.log("connected to DB");
})
.catch((err)=>{
  console.log(err);
})
async function main(){
  await mongoose.connect(db_url);
}
const store=MongoStore.create({
   mongoUrl:db_url,
   crypto:{
    secret:process.env.SESSION_SECRET
   },
   touchAfter:24*3600,
});

store.on("error",()=>{
  console.log("Error in mongo session store",err);
})

app.use(session({
    secret: process.env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,    // extra security
        secure: process.env.NODE_ENV === 'production', // only send cookie over HTTPS in production
    }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; // HA ALL EJS FILE MADHE ACCESS HONAR
    next();
});

app.get("/", (req, res) => {
  res.redirect("/home");
});
app.get("/home", (req, res) => {
    res.render("index");
});
app.get("/addbus",islogin,(req,res)=>{
  res.render("listings/addbus.ejs");
})
app.post("/buses",listingcontrollers.addbus);
app.get("/logout",listingcontrollers.logout);
app.get("/show",listingcontrollers.toproute);
app.get('/search',listingcontrollers.search);
app.get("/show/:id",islogin,listingcontrollers.busdetail);
app.get("/show/:id/book", islogin, listingcontrollers.busbook);
app.post("/show/:id/book", islogin,listingcontrollers.busbookpost);
app.get("/show/:id/add-passenger", listingcontrollers.addpassenger);
app.post("/signup", listingcontrollers.postsignup);
// Confirm booking
app.post("/show/:id/payment", islogin,listingcontrollers.payment);
// Show all bookings for logged-in user
app.get("/mybookings", islogin, listingcontrollers.mybooking);
//show bookings
app.delete("/mybooking/:id", listingcontrollers.deletebooking);
app.get("/signup", (req, res) => {
    res.render("user/signup.ejs");
});
app.get("/login", (req, res) => {
    res.render("user/login.ejs");
});
app.get("/icon",(req,res)=>{
    res.render("listings/invite.ejs");
})
app.post("/login",passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),listingcontrollers.postlogin);
//error middleware
app.use((req,res,next)=>{
    res.send("404 Page Not Found");
    next();
})
//dussereha templet
app.get("/dus",(req,res)=>{
  res.render("listings/dus.ejs")
})
//error handlers
app.use((err,req,res,next)=>{
    let{status=500,meaasge="error occur"}=err;
    res.status(status).send(meaasge);
    next(err);
});
// Start server
const PORT = process.env.PORT ||10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

