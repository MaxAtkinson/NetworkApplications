import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import db from '../db';
import bcrypt from 'bcrypt';
import sanitize from 'sanitize';
import redis    from 'redis';
import { EDESTADDRREQ, ESRCH } from 'constants';
import { runInNewContext } from 'vm';


let _client;

function redisClient() {
    return _client;
}





 function configureAuth(app, jwt, dbUrl) {
    const saltRounds = 12;

    // Create the redis client
    _client = redis.createClient();

    // Redis Connection Callback
    _client.on('connect', function() {
        console.log('Connection to Redis server successful');
    });

    // Redis Connection Callback
    _client.on('error', function() {
        console.log('Connection to Redis server unsuccessful');
    });

    // Set the application to use the sanitizing modules provived by sanitze module
    app.use(sanitize.middleware);

    app.get('/auth/login', (req, res, next) => {
        console.log(req.cookies);
        //Get the cookie if it exists then we check if the JWT exists and is valid and then redirect to the homepage
        if (!(typeof req.cookies['ChatAppToken'] === 'undefined')) {
          try
          {
            if (verifyJWT(jwt, req.cookies['ChatAppToken'])) {
                var decodedUser = decodeJWT(jwt, req.cookies['ChatAppToken']).payload;

                console.log(decodedUser.payload);
                // Now check whether the user exists in database 


                var dbo = db();
                var query = {};
                query['username'] = decodedUser.username;

                dbo.collection('users').find(query).toArray(function (error, result) {
                    if (error) {
                        console.log('Database query error');
                        return;
                    }

                    if (result.length != 1) {
                        console.log('User not database')
                        return;
                    }

                    // User is then within database so redirect to the main page
                    res.redirect('/');
                });
            }
          }
          catch (err)
          {
              next(err);
          }
        }
        // User unauthenticated so just return the login page
        else {

            res.sendFile(path.join(__dirname, '../../public/auth/login.xhtml'));
        }
    });

    app.post('/auth/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;

        /*Need to sanitise the inputs */
        var dbo = db();

        var query = {}
        query['email'] = email;
        dbo.collection('users').find(query).toArray(function (error, result) {
            if (error) 
            {
                console.log('Database query error');
                return;
            }

            if (result.length != 1) {
                console.log('User not database')
                res.json({ success: 'Incorrect Username/Password', status: 401 });
                return;
                }
                
                console.log('login for user: ' + result[0].username);
                bcrypt.compare(password, result[0].password, function (error, result) {
                    if (error) {
                        console.log('Hashing error\n\r');
                        return;
                    }

                    //Create the session and redirect to the home page if
                    // the password hash compare has returned true
                    if (result == true) {
                        // Create a valid JWT token for the user and then store this in an http cookie on user side
                        var token = createJWT(jwt, this.user);
                        res.cookie('ChatAppToken', token, { httpOnly: true, }); // Need to add the secure bit here when we come to SSL connections

                        console.log(' was successful');
                        res.json({ success: 'Login Successful', status: 200 });

                        // Need to store the status of the JWT in a redis database for fast retrival
                        redisClient().set(this.user.username,'valid',function(err,value){
                            if (err)
                            {
                                console.log("Redis Error. Unable to store JWT status");
                            }
                            else
                            {

                            }
                        });
                    }
                    else {
                        res.json({ success: 'Incorrect Username/Password', status: 401 });
                        console.log(' was unsuccessful');
                    }

                }.bind({ user: result[0] })); // Need to pass the user object in to allow for the 
            });

        });

    app.post('/auth/logout', function(req,res)
    {  
        // Check the user's JWT to get user infomation
        if (!(typeof req.cookies['ChatAppToken'] === 'undefined')) {
            if (verifyJWT(jwt, req.cookies['ChatAppToken'])) {
                var decodedUser = decodeJWT(jwt, req.cookies['ChatAppToken']).payload;

                // We assume that since the verifyJWT passed then the decodedUser's token originated from this server and
                // and therefore we do not need to check whether the user exists in the database.

    		res.cookie('ChatAppToken', { httpOnly: true, expires: new Date(Date.now()) });
                redisClient().get(decodedUser.username, function(err,value) {
                    if (err){
                        res.json({success: "User unable to be logged out", status: "500"});
                        return;
                    }
                    else {
                        redisClient().set(this.username,"invalid", function(err,value){
                            if (err){
                                res.json({success: "User unable to be logged out", status: "500"});
                                return;
                            }
                            else{
                                res.json({success: "User logged out", status: 200});
                                return;
                            }
                        });
                    }
                }.bind({ username: decodedUser.username}));
            }
        }
    });   


    app.get('/auth/register', (req, res) => {
        
    });


    app.post('/auth/register', function (req, res) {
        
        
        
        // If we don't have all the fields then we don't have a valid post and send a request error to the 
        // client
        if ((!req.body.username) || (!req.body.email) || (!req.body.password) || (!req.body.confirmPassword)) {
            res.json({success: "Incorrect Request", status: 400});
            return;
        }

        // First sanitise the fields and perform error correction
        // Uses the node-sanitize module to strip the data
        var username        = req.bodyString('username');
        var email           = req.bodyEmail('email');
        var password        = req.bodyString('password');
        var confirmPassword = req.bodyString('confirmPassword');

        console.log("Sanitize is tickty boo");
        console.log("Username in post was " + req.body.username);
        console.log("Username sanitized" + username);

        // Now check if each field is empty or valid.
        // The username is required to be at least 3 characters long
        if (username.length < 3)
        {
            // Status 202 is used to notify the client side
            res.json({success: "Username Length is too short. Usernames are required to be 3 characters long" , status:202 });
            return;
        }
        
        console.log("Username length is tickty boo.")

        // The email is required to be an email format
        // Can't be clever with the regular expressions for checking whether the correct format since we now have .local type
        // TLDs now
        var emailRegex = new RegExp("/\S+@\S+/");

        if ((emailRegex.test(email.toLowerCase())))
        {
            // Status 202 is used to notify the client side of the error 
            res.json({success: "Email Address entered is not in an email address format." , status:202 });
            return;
        }

        console.log("Email is tickty boo.")
        
        // Check that the password entered of a length of 5 characters
        if (password.length < 5)
        {
            res.json({success: "Password length is too short. Passwords are required to be at least 5 characters", status: 202});
        } 

    
        //check that both passwords were valid
        if (password != confirmPassword) {
            res.json({success: "Password and Confirm Password are not the same. Renter and then resubmit", status: 202});
        }

        
        console.log("Password is tickty boo.")

        var databaseObject;

        // Connect to the database
        var dbo = db();
        var query = {};
        query['username'] = username;

            // Check that the username doesn't already exist
            dbo.collection('users').find(query).toArray(function (error, result) {
                console.log('Users:');
                console.log(result);
                if (result[0]) {
                    res.json({success: "This username is already used. Please select another.", status: 202});
                    return;
                }

                var query = {};
                query['email'] = email;

                // Check if the email address doesn't already exist
                dbo.collection('users').find(query).toArray(function (error, result) {
                    console.log('Email:');
                    console.log(result);
                    if (result[0]) {
                        res.json({success: "This email address is already in use. Reset your password", status: 202});
                        return;
                    }

                    //BCrypt the password into a hash and then create the user
                    bcrypt.hash(password, saltRounds, function (error, hashResult) {
                        //Format the new user
                        var newUser = {};
                        newUser.username = username;
                        newUser.email = email;
                        newUser.password = hashResult;

                        // Create the new user
                        dbo.collection('users').insertOne(newUser, function (error, result) {
                            if (error) {
                                res.json({success: "Problem adding new user to database", status: 500});
                                return;
                            }
                            else {
                                console.log('New User: ' + newUser.username + ' added.');
                                res.json({success: "New User" + newUser.username + "as added successfully", status: 200});
                                return;
                            }

                        });
                    });
                });
            });
    });

    
    // Get used to check whether the user is authenticated and provide user object 
    // information to the client side.
    // This is to be used for disabling elements of the chat client on load of the page
    app.get('/auth/verifyJWT',function (req,res, next) {
        // Check whether the provided cookie has a ChatApp Token.
        // If not return a user undefined object
        if (!(typeof req.cookies['ChatAppToken'] === 'undefined')) {
            try
            {
            if (verifyJWT(jwt, req.cookies['ChatAppToken'])) {
                var decodedUser = decodeJWT(jwt, req.cookies['ChatAppToken']).payload;

                // Check the status if the JWT with redis. Has it been invalidated for the user
                redisClient().get(decodedUser.username, function(err,value) {
                    if (err){
                        res.json({success: "Redis error: User unable to be verified", status: "500"});
                        return;
                    }
                    else if (value == 'valid') {
                        // We need to strip information from the user object we are about to send.
                        // I.e. we only give the username and email address. No passwords or
                        // sensitive info such as date of births.

                        var userToSend = { username: decodedUser.username , email: decodedUser.email};
                        res.json({user: userToSend, success: 'User has a valid JWT', status: 200});
                        return;
                    }
                    else
                    {
                        res.json({success: "User does not have a valid JWT", status: 200});
                        return;
                    }
                });
            }
            }
            catch (err)
            {
                return next(err);
            }
        }
        // The user hasn't successfully logged in before and therefore send an empty user object.
        else
        {
            res.json({success: 'User does not have a valid JWT', status: 200});
        }
    });

    // Updateuser form submission. Used for updating a user's details within the system
    app.post('/auth/updateuser', function(req, res)
    {



    });

}




// initialiseJWT imports the private and public key into the node.js script
// and sets the signing options
function createJWT(jwt, user) {
    var privateKeyPath = path.join(__dirname, '../../src/auth/private.key');
    var publicKeyPath = path.join(__dirname, '../../src/auth/public.key');
    var PrivateKey = fs.readFileSync(privateKeyPath, 'utf8');
    var PublicKey = fs.readFileSync(publicKeyPath, 'utf8');

    var signerOptions =
    {
        issuer: 'Chat App',
        audience: 'http://localhost:3000',
        expiresIn: '12h',
        algorithm: 'RS256'
    }

    var generatedToken = jwt.sign(user, PrivateKey, signerOptions);

    return generatedToken;

    console.log('Created Token for user: ' + user.username);

}



function verifyJWT(jwt, token) {
    var publicKeyPath = path.join(__dirname, '../../src/auth/public.key');
    var PublicKey = fs.readFileSync(publicKeyPath, 'utf8');

    var signerOptions =
    {
        issuer: 'Chat App',
        audience: 'http://localhost:3000',
        expiresIn: '12h',
        algorithm: ['RS256']
    }

    jwt.verify(token, PublicKey, signerOptions, function(err,decoded)
    {
        if (err)
        {
            console.log("")
        }
        else
        {
            
        }

    });

    return ;
}

function decodeJWT(jwt, token) {
    return jwt.decode(token, { complete: true });
}

function logErrors(err,req,res,next)
{
    console.error(err.stack);
}

module.exports.configureAuth    = configureAuth;
module.exports.decodeJWT        = decodeJWT;
module.exports.verifyJWT        = verifyJWT;
module.exports.createJWT        = createJWT;
module.exports.redisClient      = redisClient;
module.exports.logErrors        = logErrors;