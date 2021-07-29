const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser:true,useUnifiedTopology:true})
const app = express()

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true
}))
app.set('view engine','ejs')

const userSchema = new mongoose.Schema({
    email:String,
    password:String
})

const secretKey = "BIGSTRINGEWEWDAWDAWIDAWDIJAWDOAWKJDOAWDKAW"
userSchema.plugin(encrypt,{secret:secretKey,encryptedFields:['password']})
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
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    })
    newUser.save(function(err){
        if(err){
            console.log(err)
        } else {
            res.render("secrets")
        }
    })
})
app.post('/login',function(req,res){
    const username =req.body.username;
    const password = req.body.password;

    User.findOne({email:username},(err,found)=>{
        if(err){
            console.log(err)
        } else {
            if(found){
                if(found.password === password){
                    res.render('secrets')
                } else {
                    res.send("WRONG PASSWROD")
                }
            }
        }
    })
})
app.listen('3000',function(){
    console.log("running on 3000")
})