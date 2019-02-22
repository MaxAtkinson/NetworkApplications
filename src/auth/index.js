import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import db from '../db';
import bcrypt from 'bcrypt';

export default function configureAuth(app, jwt, dbUrl) {
    const saltRounds = 12;

 

    app.get('/auth/login', (req, res) => {
        var dbo = db();
        var query = {};
        console.log(req.cookies);
        //Get the cookie if it exists then we check if the JWT exists and is valid and then redirect to the homepage
        if (!(typeof req.cookies['ChatAppToken'] === 'undefined')) {
            if (verifyJWT(jwt, req.cookies['ChatAppToken'])) {
                var decodedUser = decodeJWT(jwt, req.cookies['ChatAppToken']).payload;

                console.log(decodedUser.payload);
                // Now check whether the user exists in database 
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
        // User unauthenticated so just return the login page
        else {

            res.sendFile(path.join(__dirname, '../../public/auth/login.xhtml'));
        }
    });

    app.post('/auth/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;

        /*Need to sanitise the inputs */

        //Connect to the database
        var dbo = db();
        var query = {};
        
      
        query['email'] = email;
        dbo.collection('users').find(query).toArray(function (error, result) {
            if (error) {
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
                    //res.redirect('/');
                }
                else {
                    res.json({ success: 'Incorrect Username/Password', status: 401 });
                    console.log(' was unsuccessful');
                }

            }.bind({ user: result[0] })); // Need to pass the user object in to allow for the 
        });



        

    });

    app.get('/auth/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../../public/auth/register.xhtml'));
    });


    app.post('/auth/register', function (req, res) {
        // If we don't have all the fields then we don't have a valid post
        // Disp[]
        if ((!req.body.username) || (!req.body.email)) {
            //res.status('400');
            //res.sendFile(path.join(__dirname, '../public/404.xhtml'));
        }

        // First sanitise the fields and perform error correction
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var confirmPassword = req.body.confirmPassword;

        /*
        req.checkBody('username', 'Username is Required').notEmpty();
        req.checkBody('email', 'Email Address is Required').notEmpty();
        req.checkBody('password', 'Password is Required').notEmpty();
       
        var errors = req.validationErrors();
        if (errors)
        {
            req.session.success = false;
            return;
        }
        */
        //check that both passwords were valid
        if (password != confirmPassword) {
            req.session.succsss = false;
            console.log('Password Match Failed');
        }

        var databaseObject;

        // Connect to the database
        var dbo = db();
        var query = {};
      
        // if (error) {
        //     console.log('Problem connecting to database');
        //     throw error;
        // }


        query['username'] = username;

        // Check that the username doesn't already exist
        dbo.collection('users').find(query).toArray(function (error, result) {
            console.log('Users:');
            console.log(result);
            if (result[0]) {
                console.log('Username already exists\n\r');
                return;
            }

            var query = {};
            query['email'] = email;

            // Check if the email address doesn't already exist
            dbo.collection('users').find(query).toArray(function (error, result) {
                console.log('Email:');
                console.log(result);
                if (result[0]) {
                    console.log('Email Address already in use\n\r');
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
                            console.log('Problem adding user');
                            console.log(error);
                        }
                        else {
                            console.log('New User: ' + newUser.username + ' added.');
                            res.redirect('/auth/login');
                        }

                    });

                    //db.close();

                });
            });
        });
        
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


    return jwt.verify(token, PublicKey, signerOptions);
}

function decodeJWT(jwt, token) {
    return jwt.decode(token, { complete: true });
}


/*    //Session Authentication
function createSession(user)
{
    const uuidv4 = require('uuid/v4');
    var session_secret = uuidv4;
    var sessionData = {};
    sessionData['cookieName']       = 'chatapp_session',
    sessionData['session_secret']   = session_secret,
    sessionData['duration']         = 60 * 10 * 1000 //10 minutes active session
    sessionData['activeDuration']   = 60 * 60 * 1000 // 1 hour active session
    //
    user.session        = session_secret;
    user.lastlogintime  = new Date();
    var dbo = db.db('chatapp');
    var query = {}
    query['email'] = user.email;
    var newValues;
    newValues['session_uuid'] = session_secret;
    newValues['lastlogintime'] = new Date();
    dbo.collection('users').updateOne(query,newValues,function(error,result)
    {
        if (error)
        {
            console.log('Database query error');
            throw error;
            return;
        }
        else if (result.n != 1)
        {
            console.log('Not updated properly\n\r');
        }
    });
}
*/