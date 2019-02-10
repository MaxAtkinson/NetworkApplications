export default function configureAuth(app,path,bodyParser,express,db_url)
{
    const saltRounds = 12;
    var MongoClient = require('mongodb').MongoClient;

    app.get('/auth/register', (req, res) => {
        res.sendFile(path.join(__dirname, '../../public/auth/register.xhtml'));
    });
    
    
    app.post('/auth/register',function(req,res)
    {
        // If we don't have all the fields then we don't have a valid post
        // Disp[]
        if ((!req.body.username) ||(!req.body.email))
        {
            //res.status("400");
            //res.sendFile(path.join(__dirname, '../public/404.xhtml'));
        }
    
        // First sanitise the fields and perform error correction
        var username = req.body.username;
        var email    = req.body.email;
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
        if (password != confirmPassword)
        {
            req.session.succsss = false;
            console.log("Password Match Failed");
        }
    
        var databaseObject;
    
        // Connect to the database
        MongoClient.connect(db_url,function(error,db)
        {
            if (error)
            {
                console.log("Problem connecting to database");
                throw error;
            }
    
            var dbo = db.db('chatapp');
            var query = {};
            query['username'] = username;
    
            dbo.collection('users').find(query).toArray(function(error,result)
            {
                console.log("Users:");
                console.log(result);
                if (result[0])
                {
                    console.log("Username already exists\n\r");
                    return;
                }
            
                var query = {};
                query['email'] = email;
    
                dbo.collection('users').find(query).toArray(function(error,result)
                {
                    console.log("Email:");
                    console.log(result);
                    if (result[0])
                    {
                        console.log("Email Address already in use\n\r");
                        return;
                    }

                    //BCrypt the password into a hash and then create the user
                    bcrypt.hash(password,saltRounds, function(error, hashResult)
                    {
                        //Format the new user
                        var newUser = {};
                        newUser.username        = username;
                        newUser.email           = email;
                        newUser.password        = hashResult;
            
                        dbo.collection('users').insertOne(newUser,function(error,result)
                        {
                            if (error)
                            {
                                console.log("Problem adding user");
                                console.log(error);
                            }
                            else
                            {
                                console.log("New User: " + newUser.username + " added." );
                            }
                        
                        });
    
                        db.close();
                    });
                });
            });
        });
    });
}