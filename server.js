//get all required libs, set values
const pug = require('pug');
const mongoose = require("mongoose");
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
mongoose.connect('mongodb://localhost/a4', {useNewUrlParser: true});
const ObjectID = require('mongodb').ObjectID;
let db = mongoose.connection;
let Users = db.collection("users");
const fs = require("fs");
const express = require('express')
const session = require('express-session');
const { render } = require("pug");
const e = require("express");
const app = express()
app.listen(3000);
console.log("Server listening on port 3000");
app.set("view engine", "pug");

//define the store for mongo stored session data
const MongoDBStore = require('connect-mongodb-session')(session);
let store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/connect_mongodb_session_test',
    collection: 'mySessions'
  });

//define session and other values
app.use(session({ secret: 'some secret here',store: store}))
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//define gateways
app.get('/', serveHome);
app.get('/users',serveUsers)
app.get('/userSearch/:name',updateUsers);
app.get('/users/:userID',serveSpecificUser)
app.post('/users/:userID',updateSpecificUser)
app.get('/login', serveLogin);
app.get('/register',serveRegister)
app.post('/register',register);
app.post("/login", login);
app.get("/logout", logout);
app.get("/orders",serveOrderForm)
app.get('/orders/:orderID',serveSpecificOrder);
app.post("/orders",processOrder);
//to read the HTML files
app.get("/orderform.js", sendOrderJs);
app.get("/userList.js", sendUserList);

//function to serve a specific order
function serveSpecificOrder(req,res,next){
    orderID = String(req.params.orderID);
    //console.log(orderID)
    //find the user who placed this order (will give us the attached order info)
    db.collection("users").findOne({"orders.uniqueID": orderID},function(err,result){
        if (err) throw err;
        //make sure order exists
        if(result == null){
            res.status(404).send("ORDER DOES NOT EXIST")
            return;
        }
        //make sure user is allowed to access
        if (result.privacy == false || req.session.username == result.username){
            //get the right order
            let orderToSend;
            result.orders.forEach(order=>{
                if (order.uniqueID == orderID){
                    //console.log("match found")
                    orderToSend = order;
                }
            });

            //render the page
            res.render("specificOrder",{order: orderToSend, session: req.session, user: result})
            //console.log(result);
        }else{
            res.status(403).send("YOU MAY NOT ACCESS THIS ORDER")
        }
    });
}


//function to serve the orderform page
function serveOrderForm(req,res,next){
    //can only render if logged in
    if(req.session.loggedin){
        res.render("orderform",{session: req.session});
    }else{//if not logged in, go to home page
        res.render("homeLogged",{session: req.session})
    }
}

//function to process the order
function processOrder(req,res,next){
    //get order info
    orderToAdd = req.body;
    //console.log(orderToAdd)
    orderToAdd.shopperID= req.session._id;
    //generate a random ID for the order
    orderToAdd.uniqueID= String(Math.floor(Math.random() * 10000000 * orderToAdd.tax) +1);
    //get user from db
    db.collection("users").findOne({"_id": ObjectID(req.session._id)},function(err,result){
        //console.log(result)
        //add the order we want to add to the list
        updatedOrders = result.orders;
        updatedOrders.push(orderToAdd);
        //console.log(updatedOrders)
        //update the list in the db
        db.collection("users").updateOne({username:result.username}, {$set: {orders: updatedOrders}},function(err,result){
            //console.log("Order Updated!")
            res.status(200).send();
        })
    })
}

//a function to register a new user
function register(req,res,next){
    //get vals from form
    //I set the username to be lowercase after discussion with TA, this ensures no duplicates 
    let username = req.body.username.toLowerCase();
	let password = req.body.password;
    /*
    console.log("Registering with credentials:");
    console.log("Username: " + req.body.username);
    console.log("Password: " + req.body.password);
    */
    //find user by name, do not need to be case insensitive in search (i.e using regex and option i), as I set all usernames to lower on registration. I confirmed this approach with TA and was told it was alright. 
    db.collection("users").findOne({"username": username}, function(err, result){
        if (result != null){//if a user is found
            res.render('register',{error: true})
        }else{//if the user is not currently in the db
            //define the new user to be added
            newUser= {
                username: username,
                password: password,
                privacy: false,
                orders: []
            }
            //add the user
            db.collection("users").insertOne(newUser,function(err,result){
                if(err) throw err;
                //console.log("I added a new user")
                //console.log(result);
                //log in user
                req.session.loggedin = true;
                req.session._id= result.insertedId;
                console.log(req.session._id);
                req.session.username = username;
                //find the user to pass the new data to the user login page
                db.collection("users").findOne({"username": username}, function(err, result){
                    res.render("specificUser",{user: result ,session: req.session});
                });
            })
        }
    })
}

//a function to serve the register page
function serveRegister(req,res,next){
    //not allowed to register if you are logged in
    if (req.session.loggedin){
        res.render("homeLogged",{session: req.session})
    }else{
        res.render(`register`);
    }
}

//function to search for users given condition from client
function updateUsers(req,res,next){
    //get the username
    username = req.params.name
    db.collection("users").find({username: {$regex : username, $options: 'i'}, privacy: false}).toArray(function(err, results){
		if(err) throw err;
		let users = results;
        //send the pug file with the newly updated users for the page to render.
        res.status(200).send(pug.renderFile("./views/users.pug",{users: users, session: req.session}));
        //console.log("New page rendered")
    });
    //console.log('OUT OF LOOP')
}

//function to serve the login  page
function serveLogin(req,res,next){
    //if the session already exists as logged in
    if(req.session.loggedin){
        res.render("homeLogged", {session: req.session})
		return;
	}
    res.render("login")
}
//function to serveHome
function serveHome(req,res,next){
    res.render("homeLogged", {session: req.session})
}
//function to update a specific user's privacy setting
function updateSpecificUser(req,res,next){
    userID = req.params.userID;
    //find the user
    db.collection("users").findOne({"_id": ObjectID(userID)},function(err,result){
        //console.log(result)
        //update the user
        db.collection("users").updateOne({username:result.username}, {$set: {privacy: !result.privacy}},function(err,result){
            //console.log("succesful insertion")
            //find the updated user
            db.collection("users").findOne({"_id": ObjectID(userID)},function(err,result){
                res.render(`specificUser`,{user: result, session: req.session})
            });
        });
    });
}

//serve a specific user profile
function serveSpecificUser(req,res,next){
    //get userID
    userID = req.params.userID;
    //console.log(userID);
    //find user in collection
    db.collection("users").findOne({"_id": ObjectID(userID)},function(err,result){
        // console.log(result);
        //ensure result is not null
        if(err) throw err;
        if (result == null){
            res.status(404).send("ACCOUNT DOES NOT EXIST")
            return;
        }
        //if the user is logged on as themselves
        if (req.session.username == result.username){
            //console.log("Own user info")
            res.render(`specificUser`,{user: result, session: req.session})
        //after identity check, check if privacy is false
        }else if(result.privacy== false){
            res.render(`specificUser`,{user: result, session: req.session})
        //if the user is not itself or a public account, DENY access.
        }else{
            res.status(403).send("YOU DO NOT HAVE ACCESS")
        }
    })

}
//serves a webpage with all the current users if html, if JSON serves the users JSON object
function serveUsers(req,res,next){
    db.collection("users").find({privacy: false}).toArray(function(err, results){
		if(err){
             throw err;
        }
        else{
            let users = results;
            res.format({
                "application/json": function(){//if JSON
                    res.status(200).json({users: users});
                },//ELSE IF html
                "text/html": () => { res.render("users",{users: users, session: req.session}) }
            });
        }
    });
    
}
//function to log in, much functionality taken from prof's lecture code
function login(req, res, next){
    //console.log("I have run!");
    //if the session already exists as logged in
	if(req.session.loggedin){
        res.render("homeLogged", {session: req.session})
		return;
	}

	let username = req.body.username;
	let password = req.body.password;
    //console.log("Logging in with credentials:");
    //console.log("Username: " + req.body.username);
    //console.log("Password: " + req.body.password);
    let currUser;
    //try to find the user
    db.collection("users").findOne({"username": username}, function(err, result){
		if(err || result == null){//if the user can't be found, rerender page
            //console.log('DIDNT FIND IT')
            res.render("login",{error: "Unauthorized. No username exists"})
        }else{
            //console.log('found it!')
		    currUser = result;
            //console.log(currUser)
            //if passwords match
            if(currUser.password === req.body.password){
                req.session.loggedin = true;
                //We set the username associated with this session
                //On future requests, we KNOW who the user is
                //We can look up their information specifically
                //We can authorize based on who they are
                req.session._id= result._id
                req.session.username = username;
                //go to homepage once logged in
                res.render("homeLogged", {session: req.session})
            }else{//didnt find a match for password
                res.render("login",{error:"Not authorized. Invalid password."})
            }
        }
    });
}

function logout(req, res, next){
	if(req.session.loggedin){
		req.session.loggedin = false;
    req.session.username = undefined;
        res.render("homeLogged", {session: req.session})
	}else{
        res.render("homeLogged", {session: req.session})
	}
}

//read and send the orderForm js file for use
function sendOrderJs(req,res,next){
	fs.readFile("orderform.js", function(err, data){
		if(err){
			res.status(500).send("Error.");
			return;
		}
		res.status(200).send(data)
	});
}

//read and send the userList js file for use
function sendUserList(req,res,next){
	fs.readFile("userList.js", function(err, data){
		if(err){
			res.status(500).send("Error.");
			return;
		}
		res.status(200).send(data)
	});
}