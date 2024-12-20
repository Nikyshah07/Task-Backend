const express=require('express')
const cors=require('cors')
const bcrypt=require('bcryptjs')
const app=express()
const jwt=require("jsonwebtoken")
require('./conn')
const User=require('./user')
const Task=require('./task')
app.use(cors())
app.use(express.json())
require("dotenv").config()

app.post('/sign',async(req,res)=>{
    const {username}=req.body;
    const {email}=req.body;
    const existinguser=await User.findOne({username});
    const existingemail=await User.findOne({email});
    if(existinguser)
    {
        return res.status(400).json({message:"username already exist"})
    }
    else if(username.length<4)
    {
        return res.status(400).json({message:"username should have atleast 4 character"})
    }
    if(existingemail)
        {
            return res.status(400).json({message:"email already exist"})
        }
        const hashedpassword=await bcrypt.hash(req.body.password,10)
        const newuser=new User({
            username:req.body.username,
            email:req.body.email,
            password:hashedpassword
        })
        await newuser.save();
        return res.status(200).json({message:"Sign in successfully..."})
})

app.post("/login",async(req,res)=>{
    const {username,password}=req.body;
    const existinguser=await User.findOne({username});
    if(!existinguser)
        {
            return res.status(400).json({message:"Invalid credentials"})
        }
        bcrypt.compare(password,existinguser.password,(err,data)=>{
            if(data)
            {
                const authclaims=({name:username},{jti:jwt.sign({},"abcd")})

                const token=jwt.sign({authclaims},"abcd",{expiresIn:"2d"});
                res.status(200).json({id:existinguser._id,token:token})
            }
            else{
                return res.status(400).json({message:"Invalid credentials"})
            }
        })
})


const authenticatetoken=(req,res,next)=>{
    const authheader=req.headers["authorization"];
    const token=authheader && authheader.split(" ")[1]
    if(token==null)
    {
        res.status(400).json({message:"Authentication token is required"})
    }
    jwt.verify(token,"abcd",(err,user)=>{
        if(err)
        {
            res.status(400).json(err)
        }
        req.user=user
        next();
    })
}

app.post("/createtask",authenticatetoken ,async(req,res)=>{
    try{
        const {title,desc}=req.body;
        const {id}=req.headers;
        const newtask=new Task({title:title,desc:desc})
        const savetask=await newtask.save();
        const taskid=savetask._id;
        await User.findByIdAndUpdate(id,{$push:{tasks:taskid._id}})
        res.status(200).json({message:"Task created"})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
    
})

app.get("/getalltask",authenticatetoken,async(req,res)=>{
    try{
    const {id}=req.headers;
    const userdata=await User.findById(id).populate({path:"tasks",
    options:{sort:{createdAt:-1}}
    })
    res.status(200).json({data:userdata})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})

app.delete("/deletetask/:id",authenticatetoken,async(req,res)=>{
    try{
    const {id}=req.params
    const userid=req.headers.id;
    await Task.findByIdAndDelete(id)
    await User.findByIdAndUpdate(userid,{$pull:{tasks:id}})
    res.status(200).json({message:"Task deleted succcessfully"})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})


app.put("/updatetask/:id",authenticatetoken,async(req,res) =>{
    try{
     const {id} =req.params;
     const {title,desc}=req.body;
     await Task.findByIdAndUpdate(id,{title:title,desc: desc});
    res.status(200).json({message:"Task updated succcessfully"})
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})


app.put("/updateimptask/:id",authenticatetoken,async(req,res) =>{
    try{
     const {id}=req.params;
     const taskdata= await Task.findById(id);
     const imptask=taskdata.important;
     await Task.findByIdAndUpdate(id,{important:!imptask});
    res.status(200).json({message:"Task updated succcessfully"})
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})

app.put("/updatecomptask/:id",authenticatetoken,async(req,res) =>{
    try{
     const {id}=req.params;
     const taskdata= await Task.findById(id);
     const comptask=taskdata.complete;
     await Task.findByIdAndUpdate(id,{complete:!comptask});
    res.status(200).json({message:"Task updated succcessfully"})
    }catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})

app.get("/getimptask",authenticatetoken,async(req,res)=>{
    try{
    const {id}=req.headers;
    const Data=await User.findById(id).populate({
        path:"tasks",
        match:{important:true},
    options:{sort:{createdAt:-1}}
    })
    const imptaskdata=Data.tasks
    res.status(200).json({data:imptaskdata})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})


app.get("/getcomptask",authenticatetoken,async(req,res)=>{
    try{
    const {id}=req.headers;
    const Data=await User.findById(id).populate({
        path:"tasks",
        match:{complete:true},
    options:{sort:{createdAt:-1}}
    })
    const comptaskdata=Data.tasks
    res.status(200).json({data:comptaskdata})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})


app.get("/getincomptask",authenticatetoken,async(req,res)=>{
    try{
    const {id}=req.headers;
    const Data=await User.findById(id).populate({
        path:"tasks",
        match:{complete:false},
    options:{sort:{createdAt:-1}}
    })
    const comptaskdata=Data.tasks
    res.status(200).json({data:comptaskdata})
    }
    catch(error){
        console.log(error);
        res.status(400).json({message:"Internal server error"})
    }
})



app.use("/",(req,res)=>{
    res.send("hello")
})
app.listen(`${process.env.PORT}`,()=>{
    console.log("server started")
})