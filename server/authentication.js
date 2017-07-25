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
        '"username" TEXT,' +
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
        addUser('AirLiquide','AirLiquide');
    });
    passport.use(new LocalStrategy(function(username, password, done) {
        db.get('SELECT salt FROM user WHERE username = ?', username, function(err, row) {
            if (!row) return done(null, false);
            var hash = hashPassword(password, row.salt);
            db.get('SELECT username, id FROM user WHERE username = ? AND password = ?', username, hash, function(err, user) {
            if (!user) return done(null, false);
            db.run("INSERT INTO login(user_id) VALUES(?)",user.id);
            return done(null, user);
            });
        });
    }));

    passport.serializeUser(function(user, done) {
        return done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        db.get('SELECT id, username FROM user WHERE id = ?', id, function(err, user) {
            if (!user) return done(null, false);
            return done(null, user);
        });
    });
}

var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()){
    var user_id = req.session.passport.user;
    db.run("INSERT INTO request(user_id,url) VALUES(?,?)",user_id,req.url);
    return next();
  }
  res.redirect('/login');
}

var authenticate = function(){
      return passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                failureFlash: false});
}

function addUser(username,password){
    var salt = hashPassword(username,new Date().toISOString());
    var encryptedPassword = hashPassword(password,salt);
  db.run("INSERT INTO user(username,password,salt) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM USER WHERE username = ?)",username,encryptedPassword,salt,username);
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
    "isAuthenticated":isAuthenticated,
    "addUser":addUser
}