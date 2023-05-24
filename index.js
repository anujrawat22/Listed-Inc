const express = require("express")
require("dotenv").config()
const app = express()
const { google } = require('googleapis');
const { OauthRouter } = require("./routes/oauth.router");

app.use("/oauth",OauthRouter)




const scope = ['https://www.googleapis.com/auth/userinfo.email'];

const AuthUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scope,
});




app.listen(process.env.PORT || 8080 , ()=>{
    console.log(`Server running on PORT ${process.env.PORT}`)
})