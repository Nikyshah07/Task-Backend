const mongoose =require('mongoose')
require("dotenv").config()
const conn=async()=>{
    try{
    const response=await mongoose.connect(`${process.env.URI}`)
    if(response)
    {
        console.log("Connected to DB")
    }
}
   catch(error){
        console.log(error)
    }
}
conn()