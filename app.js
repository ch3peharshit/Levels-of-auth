require('dotenv').config()
//const bcrypt = require('bcrypt')
//const saltRounds = 10;
//const md5 = require('md5')
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const  session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
//const encrypt = require('mongoose-encryption')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')
const app = express()

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session())

mongoose.connect(process.env.DB_HOST,{useNewUrlParser:true,useUnifiedTopology:true})
mongoose.set("useCreateIndex",true)

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true
}))
app.set('view engine','ejs')

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    Secrets:String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})
const User = new mongoose.model("user",userSchema)

//passport.use(User.createStrategy())
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken,refreshToken,profile,cb){
    
    User.findOrCreate({googleId:profile.id},function(err,user){
        return cb(err,user);
    })

}
))
passport.serializeUser(function(user,done){
    done(null,user.id)
})
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user)
    })
})

app.get('/',function(req,res){
    res.render('home')
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
app.get('/auth/google/secrets',
passport.authenticate('google',{failureRedirect:'/login'}),function(req,res){
    res.redirect('/secrets')
})
app.get('/login',function(req,res){
    res.render('login')
})
app.get('/register',function(req,res){
    res.render('register')
})
//app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     const newUser = new User({
    //         email:req.body.username,
    //         password:hash
    //     })
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err)
    //         } else {
    //             res.render("secrets")
    //         }
    //     })
    // })
    
    
//})
//app.post('/login',function(req,res){
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email:username},(err,found)=>{
    //     if(err){
    //         console.log(err)
    //     } else {
    //         if(found){
    //             bcrypt.compare(password,found.password,function(err,bcryptRes){
    //                 if(bcryptRes === true){
    //                     res.render('secrets')
    //                 } else {
    //                     res.send("WRONG PASSWORR")
    //                 }
    //             })
    //         }
    //     }
    // })
//})

app.post('/register',function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,newRegisteredUser){
        if(!err){
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        } else {
            console.log(err)
            res.redirect('/register')
        }
    })
})
app.post('/login',function(req,res){
    const user = new User({
        username: req.body.username,
        passowrd:req.body.password
    })
    req.login(user,function(err){
        if(!err){
                passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets')
            })
        } else {
            console.log(err)
        }
    })
})
app.get('/secrets',function(req,res){
    // if(req.isAuthenticated()){
    //     User.findById(req.user.id,function(err,found){
    //         if(!err){
    //             if(found){

    //             }
    //         } else {
    //             console.log("no secrets found")
    //         }
    //     })
    //     res.render("secrets")
    // } else {
    //     res.redirect('/login')
    // }
    User.find({"Secrets":{$ne:null}},function(err,found){
        if(err){
            console.log(err)
        } else {
            if(found){
                res.render("secrets",{userWithSecrets:found})
            }
        }
    })
    
})
app.get('/logout',function(req,res){
    req.logout()
    res.redirect('/')
})
app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})
app.post('/submit',function(req,res){
    const secretSubmitted = req.body.secret;
    
    User.findById(req.user.id,function(err,found){
        if(!err){
            if(found){ 
                found.Secrets = secretSubmitted;
                found.save(function(){
                    res.redirect("/secrets")
                })
            } 
        } else {
            console.log("error")
        }
    })
})
app.listen('3000',function(){
    console.log("running on 3000")
})