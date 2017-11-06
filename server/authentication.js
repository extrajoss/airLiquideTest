const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;
const sqlite3 = require('sqlite3');
const crypto = require('crypto');

var db;

var init = function(app){
    app.use(passport.initialize());
    app.use(passport.session());
    db = new sqlite3.Database('./database.sqlite3');
    db.serialize(function() {
    db.run('CREATE TABLE IF NOT EXISTS "user" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"fullname" TEXT,' +
        '"email" TEXT,' +
        '"password" BINARY(32), ' +
        '"salt" BINARY(32),' +
        '"created_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
    db.run('CREATE TABLE IF NOT EXISTS "login" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"logged_in_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
        db.run('CREATE TABLE IF NOT EXISTS "request" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"url" TEXT,' +
        '"requested_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')');
        addUser({fullname:'AirLiquide',email:'michael.joss@gmail.com',password:'AirLiquide'});
    });
    passport.use('local-login',new LocalStrategy(
        {        
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true
        },
        function (req, email, password, done) {
            try {
                db.get('SELECT salt FROM user WHERE email = ?', email, function (err, row) {
                    if (!row) return done(null, false, req.flash( "loginMessage", 'Unknown email.' ));
                    var hash = hashPassword(password, row.salt);
                    db.get('SELECT fullname, email, id FROM user WHERE email = ? AND password = ?', email, hash, function (err, user) {
                        if (!user) return done(null, false, req.flash( "loginMessage", 'Incorrect password.' ));
                        db.run("INSERT INTO login(user_id) VALUES(?)", user.id);
                        return done(null, user);
                    });
                });
            } catch (err) {
                return done(err);
            }
        }));

        passport.use('local-register',new LocalStrategy(
            {        
                usernameField : 'email',
                passwordField : 'password',
                passReqToCallback : true
            },
            function (req, email, password, done) {
                try {
                    db.get('SELECT salt FROM user WHERE email = ?', email, function (err, row) {
                        if (row) return done(null, false, req.flash( "registerMessage", 'That email is already taken.' ));
                        return addUser({fullname:req.body.fullname,email:email,password:password},function(user){
                            return done(null, user);
                        });                        
                    });
                } catch (err) {
                    return done(err);
                }
            }));

    passport.serializeUser(function(user, done) {
        return done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        db.get('SELECT id, fullname, email FROM user WHERE id = ?', id, function(err, user) {
            if (!user) return done(null, false);
            return done(null, user);
        });
    });
}

var isAuthenticated = function (req, res, next) {
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

function addUser(user,callback){
    var salt = hashPassword(user.email,new Date().toISOString());
    var encryptedPassword = hashPassword(user.password,salt);
    user.password = encryptedPassword;
    db.run("INSERT INTO user(fullname,email,password,salt) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM USER WHERE email = ?)",user.fullname,user.email,encryptedPassword,salt,user.email,
        function(err){
            user.id = this.lastID;
            if(callback){
                return callback(user);
            }
        }
    );
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
    "addUser":addUser
}