require('dotenv').config()
const bcrypt = require('bcrypt')
const saltRounds = 10;
//const md5 = require('md5')
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')
mongoose.connect(process.env.DB_HOST,{useNewUrlParser:true,useUnifiedTopology:true})
const app = express()

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true
}))
app.set('view engine','ejs')

const userSchema =  mongoose.Schema({
    email:String,
    password:String
})


//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})
const User = new mongoose.model("user",userSchema)
app.get('/',function(req,res){
    res.render('home')
})
app.get('/login',function(req,res){
    res.render('login')
})
app.get('/register',function(req,res){
    res.render('register')
})
app.post("/register",function(req,res){
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const newUser = new User({
            email:req.body.username,
            password:hash
        })
        newUser.save(function(err){
            if(err){
                console.log(err)
            } else {
                res.render("secrets")
            }
        })
    })
    
    
})
app.post('/login',function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},(err,found)=>{
        if(err){
            console.log(err)
        } else {
            if(found){
                bcrypt.compare(password,found.password,function(err,bcryptRes){
                    if(bcryptRes === true){
                        res.render('secrets')
                    } else {
                        res.send("WRONG PASSWORR")
                    }
                })
            }
        }
    })
})
app.listen('3000',function(){
    console.log("running on 3000")
})