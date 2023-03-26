const express = require('express');
const app = express();

const mongoose = require('mongoose');

const dburl = "mongodb://127.0.0.1:27017/logs";

const connectionParams = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const Login = require('./models/Login');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect( dburl, connectionParams).then(function()
{
   
        app.post("/signup", async function(req, res){

        // res.json(req.body);
        const newLogin = new Login({
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            password: req.body.password
        });
        const existLogin = await Login.findOne({name: newLogin.name});
        console.log(newLogin.name);
        //console.log(existLogin);
        if(existLogin){
            res.json('Already Login Exists.');
            console.log("Already exists");
        }
        else{
            await newLogin.save();
            //const response = { message : "New Login Created" };
            res.json({
                message: 'New Login Created!',
            });
        //res.json(response);
        }
    });

    app.get("/success", (req, res) => {
        res.send("Thanks for your submission");
    })

})
.catch((e) => {
    console.log("Error:", e);
});

app.listen(3000, function(){
    console.log("Server is running at port 3000!");
});