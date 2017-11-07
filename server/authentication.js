const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const db = require('sqlite');
const crypto = require('crypto');

var init = function(app){
    app.use(passport.initialize());
    app.use(passport.session());

    init_database();

    passport.use(
        'local-login',
        new LocalStrategy(
            {        
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true
            },
            async function (req, email, password, done) {
                try {
                    email = email.toLowerCase();
                    let user_row  = await db.get('SELECT salt FROM user WHERE email = ?', email);
                    if (!(user_row)) return done(null, false, req.flash( "loginMessage", 'Unknown email.' ));
                    let hash = hashPassword(password, user_row.salt);
                    let user = await db.get('SELECT fullname, email, id FROM user WHERE email = ? AND password = ?', email, hash);
                    if (!(user)) return done(null, false, req.flash( "loginMessage", 'Incorrect password.' ));
                    db.run("INSERT INTO login(user_id) VALUES(?)", user.id);
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

        passport.use('local-register',new LocalStrategy(
            {        
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true
            },
            async function (req, email, password, done) {
                try {
                    email = email.toLowerCase();
                    let user_row = await db.get('SELECT salt FROM user WHERE email = ?', email);
                    if (user_row) return done(null, false, req.flash( "registerMessage", 'The email [' + email + '] has already been registered.' ));
                    let new_user = {fullname:req.body.fullname,email:email,password:password};
                    return addUser(
                        new_user,
                        done
                    );   
                } catch (err) {
                    return done(err);
                }
            }));

    passport.serializeUser(function(user, done) {
        return done(null, user.id);
    });

    passport.deserializeUser(async function(id, done) {
        let user = user_from_id(id);
        if (!user) return done(null, false);
        return done(null, user);
    });
}

var user_from_id = async function (id){
    let user = await db.get('SELECT id, fullname, email FROM user WHERE id = ?', id) ;
    return user;
}

var init_database = async function(){
    await db.open('./database.sqlite3',{Promise});
    await db.run('CREATE TABLE IF NOT EXISTS "user" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"fullname" TEXT,' +
        '"email" TEXT,' +
        '"password" BINARY(32), ' +
        '"salt" BINARY(32),' +
        '"created_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
    await db.run('CREATE TABLE IF NOT EXISTS "login" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"logged_in_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
    await db.run('CREATE TABLE IF NOT EXISTS "request" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"url" TEXT,' +
        '"requested_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
    let admin_user = {
        fullname:'Admin',
        email:'Admin@AirLiquide',
        password:'AirLiquide'
    };
    addUser(admin_user);
}

var isAuthenticated = async function (req, res, next) {
  if (req.isAuthenticated()){
    var user_id = req.session.passport.user;
    db.run("INSERT INTO request(user_id,url) VALUES(?,?)",user_id,req.url);
    delete req.session.returnTo;
    return next();
  }
  req.session.returnTo = req.url;
  res.redirect('/login');
}

var authenticate = function (req, res, next) {
    let returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    return passport.authenticate(
        'local-login',
        {
            successRedirect: returnTo,
            failureRedirect: '/login',
            failureFlash: true
        }
    );
}

var register = function (req, res, next) {
    return passport.authenticate(
        'local-register',
        {
            successRedirect: '/login',
            failureRedirect: '/register',
            failureFlash: true
        }
    );
}

async function user_from_id(id){
    passport.deserializeUser
}

async function addUser(user,callback){
    var salt = hashPassword(user.email,new Date().toISOString());
    var encryptedPassword = hashPassword(user.password,salt);
    user.password = encryptedPassword;
    user.email = user.email.toLowerCase();
    let result = await db.run("INSERT INTO user(fullname,email,password,salt) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM USER WHERE email = ?)",user.fullname,user.email,encryptedPassword,salt,user.email);
    user.id = result.lastID;
    if(callback) return callback(null,user);
}

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

module.exports = {
    "init":init,
    "authenticate":authenticate,
    "register":register,
    "isAuthenticated":isAuthenticated,
    "user_from_id":user_from_id,
    "addUser":addUser
}