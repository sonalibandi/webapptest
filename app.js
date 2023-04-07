const express=require("express")
const {sequelize}=require('./Api/models/model.js')
const morgan = require("morgan")
const fs = require('fs');
const path = require('path');
// make app an express object
if(process.env.NODE_ENV === "dev") {
console.log(process.env)    
sequelize.sync().then(() => console.log("Syncing DB")).catch((err) => console.log(err,"Syncing Failed"))
 }

const app=express()
const cors=require("cors")
const routes =require('./Api/routes/routes.js');

// establish connection to tododb app.js



//----------- load middleware functions to app -----------//
app.use(express.json()) // parse request body as json and store in req.body
app.use(cors()) // enable cross origin resource sharing
app.use(express.urlencoded()) // only parse url encodied req bodies
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'combined.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));



app.use(routes)

module.exports = app;


