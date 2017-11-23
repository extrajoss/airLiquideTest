const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const db = require('sqlite')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

const AUTHENTICATION_EXCEPTIONS = [
  /^\/$/,
  /^\/(2bmm|1be9)(\?cutoff=(veryHigh|high|medium|low|-0.5|-0.6))?$/,
  /^\/data\/(2bmm|1be9)\/(veryHigh|high|medium|low|-0.5|-0.6)\/[0-5]\/$/,
  /^\/getMaps\/(2bmm|1be9)\/(veryHigh|high|medium|low|-0.5|-0.6)\/$/
]

const isExceptedFromAuthentication = function (url) {
  return AUTHENTICATION_EXCEPTIONS.some(
        (authenticationException) => {
          return authenticationException.test(url)
        }
    )
}

const init = function (app) {
  app.use(passport.initialize())
  app.use(passport.session())

  initDatabase()

  passport.use(
        'local-login',
        new LocalStrategy(
          {
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
          },
            async function (req, email, password, done) {
              try {
                email = email.toLowerCase()
                let userByEmail = await userFromEmail(email)
                if (!(userByEmail)) return done(null, false, req.flash('loginMessage', 'Unknown email.'))
                let passwordHash = hashPassword(password, userByEmail.salt)
                let userByLogin = await userFromLogin(email, passwordHash)
                if (!(userByLogin)) {
                  return done(
                    null,
                    false,
                    req.flash('loginEmail', email),
                    req.flash('loginMessage', 'Incorrect password.')
                  )
                }
                recordLogin(userByLogin.id)
                return done(null, userByLogin)
              } catch (err) {
                return done(err)
              }
            }
        )
    )

  passport.use('local-register', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
        async function (req, email, password, done) {
          try {
            email = email.toLowerCase()
            const fullname = req.body.fullname
            const confirmPassword = req.body.confirm_password

            let userByEmail = await userFromEmail(email)
            if (userByEmail) {
              return done(
                null,
                false,
                req.flash('registerFullname', fullname),
                req.flash('registerMessage', 'The email [' + email + '] has already been registered.')
              )
            }
            if (confirmPassword !== password) {
              return done(
                null,
                false,
                req.flash('registerFullname', fullname),
                req.flash('registerEmail', email),
                req.flash('registerMessage', 'The passwords do not match.')
              )
            }
            let newUser = { fullname: fullname, email: email, password: password }
            return addUser(
                    newUser,
                    done
                )
          } catch (err) {
            return done(err)
          }
        }
      )
    )

  passport.serializeUser(function (user, done) {
    return done(null, user.id)
  })

  passport.deserializeUser(async function (id, done) {
    let user = userFromId(id)
    if (!user) return done(null, false)
    return done(null, user)
  })
}

const hasSessionUser = function (session) {
  return session.passport && session.passport.user
}

const getUserIdFromSession = function (session) {
  if (hasSessionUser(session)) {
    return session.passport.user
  }
}

const userFromSession = async function (session) {
  const id = getUserIdFromSession(session)
  let user = await db.get('SELECT id, fullname, email, salt, password FROM user WHERE id = ?', id)
  return user
}

const userFromResetPasswordToken = async function (resetPasswordToken) {
  let user = await db.get('SELECT id, fullname, email, salt, password FROM user WHERE reset_password_token = ? and reset_password_expires_on > date(\'now\')', resetPasswordToken)
  return user
}

const userFromId = async function (id) {
  let user = await db.get('SELECT id, fullname, email, salt, password FROM user WHERE id = ?', id)
  return user
}

const userFromEmail = async function (email) {
  let user = await db.get('SELECT id, fullname, email, salt, password FROM user WHERE email = ?', email)
  return user
}

const userFromLogin = async function (email, password) {
  let user = await db.get('SELECT fullname, email, id, salt, password  FROM user WHERE email = ? AND password = ?', email, password)
  return user
}

const recordLogin = function (userId) {
  db.run('INSERT INTO login(user_id) VALUES(?)', userId)
}

const initDatabase = async function () {
  await db.open('./database.sqlite3', { Promise })
  await db.run('CREATE TABLE IF NOT EXISTS "user" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"fullname" TEXT,' +
        '"email" TEXT UNIQUE,' +
        '"password" BINARY(32), ' +
        '"salt" BINARY(32),' +
        '"reset_password_token" TEXT, ' +
        '"reset_password_expires_on" Datetime, ' +
        '"created_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')')
  await db.run('CREATE TABLE IF NOT EXISTS "login" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"logged_in_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')')
  await db.run('CREATE TABLE IF NOT EXISTS "request" ( ' +
        '"id" INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '"user_id" INTEGER,' +
        '"url" TEXT,' +
        '"requested_on" DATETIME DEFAULT CURRENT_TIMESTAMP ' +
        ')')
  let adminUser = {
    fullname: 'Admin',
    email: 'Admin@AirLiquide',
    password: 'AirLiquide'
  }
  addUser(adminUser)
}

const authenticatePage = function (req, res, next) {
  const ifAuthenticated = function (req, res) {
    let url = req.url
    req.session.returnTo = url
    res.redirect('/login')
  }
  authenticate(req, res, next, ifAuthenticated)
}

const authenticateApi = function (req, res, next) {
  const ifAuthenticated = function (req, res) {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify({ ErrorText: 'Failed to Authenticate' }))
  }
  authenticate(req, res, next, ifAuthenticated)
}

const authenticate = function (req, res, next, ifAuthenticated) {
  let userId = req.session.passport ? req.session.passport.user : false
  let url = req.url
  if (!isAuthenticated(req, userId, url)) {
    ifAuthenticated(req, res)
  } else {
    delete req.session.returnTo
    return next()
  }
}

const isAuthenticated = function (req, userId, url) {
  if (req.isAuthenticated()) {
    db.run('INSERT INTO request(user_id,url) VALUES(?,?)', userId, url)
    return true
  }
  if (isExceptedFromAuthentication(url)) {
    return true
  }
  return false
}

const login = function (req) {
  let returnTo = req.session.returnTo || '/'
  delete req.session.returnTo
  return passport.authenticate(
    'local-login',
    {
      successRedirect: returnTo,
      failureRedirect: '/login',
      failureFlash: true
    }
  )
}

const register = function (req) {
  let returnTo = req.session.returnTo || '/'
  delete req.session.returnTo
  return passport.authenticate(
    'local-register',
    {
      successRedirect: returnTo,
      failureRedirect: '/register',
      failureFlash: true
    }
  )
}

const manageUser = async function (req, res, next) {
  const success = req.session.returnTo || '/'
  const fail = '/manageUser'
  delete req.session.returnTo
  try {
    const userBySession = await userFromSession(req.session)
    const email = req.body.email.toLowerCase()
    const userByEmail = await userFromEmail(email)
    const password = req.body.password
    if (userByEmail && (userByEmail.id !== userBySession.id)) {
      req.flash('manageUserMessage', 'The email [' + email + '] has already been registered to another user.')
      return redirectTo(req, res, next, fail)
    }
    const passwordHash = hashPassword(password, userBySession.salt)
    if (passwordHash !== userBySession.password) {
      req.flash('manageUserMessage', 'The current password is not correct')
      return redirectTo(req, res, next, fail)
    }
    userBySession.email = email
    userBySession.fullname = req.body.fullname
    const newPassword = req.body.new_password
    if (newPassword) {
      const confirmPassword = req.body.confirm_new_password
      if (newPassword !== confirmPassword) {
        req.flash('manageUserMessage', 'The passwords do not match.')
        return redirectTo(req, res, next, fail)
      }
      userBySession.newPassword = newPassword
    }
    return updateUser(
        userBySession,
        function () { return redirectTo(req, res, next, success) }
      )
  } catch (err) {
    req.flash('manageUserMessage', err)
    return redirectTo(req, res, next, fail)
  }
}

const resetPassword = async function (req, res, next) {
  const success = '/'
  const fail = '/login'
  const token = req.params.token
  const userByToken = await userFromResetPasswordToken(token)
  if (!userByToken) {
    req.flash('loginMessage', 'Password reset token is invalid or has expired.')
    return redirectTo(req, res, next, fail)
  }
  userByToken.newPassword = req.body.new_password
  delete userByToken.resetPasswordToken
  delete userByToken.resetPasswordExpires
  return updateUser(
    userByToken,
    function () {
      req.body.email = userByToken.email
      req.body.password = req.body.new_password
      return passport.authenticate(
        'local-login',
        {
          successRedirect: success,
          failureRedirect: fail,
          failureFlash: true
        }
      )
    }
  )
}

const redirectTo = function (req, res, next, redirectTo) {
  return function (req, res, next) {
    return res.redirect(redirectTo)
  }
}

const forgotPassword = async function (req, res, next) {
  const success = '/login'
  const fail = '/forgotPassword'
  let email = req.body.email
  if (email) {
    email = email.toLowerCase()
  }
  const userByEmail = await userFromEmail(email)
  if (!email || !userByEmail) {
    req.flash('forgotPasswordMessage', 'The email [' + email + '] has not been registered')
    return redirectTo(req, res, next, fail)
  }
  userByEmail.resetPasswordToken = await getToken()
  userByEmail.resetPasswordExpires = new Date() + 3600000 // 1 hour

  updateUser(userByEmail)

  const smtpTransport = nodemailer.createTransport({
    host: 'smtp.csiro.au',
    port: 25
  })

  const mailOptions = {
    to: userByEmail.email,
    from: 'Group18@csiro.au',
    subject: 'Group18 Password Reset',
    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      'http://' + req.headers.host + '/reset/' + userByEmail.resetPasswordToken + '\n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  }
  try {
    await smtpTransport.sendMail(mailOptions)
    req.flash('loginMessage', 'An e-mail has been sent to ' + userByEmail.email + ' with further instructions.')
    return redirectTo(req, res, next, success)
  } catch (err) {
    req.flash('forgotPasswordMessage', err.message)
    return redirectTo(req, res, next, fail)
  }
}

const getToken = async function () {
  const buf = await crypto.randomBytes(20)
  const token = buf.toString('hex')
  return token
}

const addUser = async function (user, callBack) {
  let salt = hashPassword(user.email, new Date().toISOString())
  let encryptedPassword = hashPassword(user.password, salt)
  user.password = encryptedPassword
  user.email = user.email.toLowerCase()
  let result = await db.run('INSERT INTO user(fullname,email,password,salt) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM USER WHERE email = ?)', user.fullname, user.email, user.password, salt, user.email)
  user.id = result.lastID
  if (callBack) return callBack(null, user)
}

const updateUser = async function (user, callBack) {
  if (user.newPassword) {
    let salt = hashPassword(user.email, new Date().toISOString())
    let encryptedPassword = hashPassword(user.newPassword, salt)
    user.password = encryptedPassword
    user.salt = salt
  }
  user.email = user.email.toLowerCase()
  await db.run('update user set fullname = ?,email = ?,password = ?,salt = ? , reset_password_token = ?, reset_password_expires_on = ? WHERE id = ?', user.fullname, user.email, user.password, user.salt, user.resetPasswordToken, user.resetPasswordExpires, user.id)
  if (callBack) return callBack(null, user)
}

const hashPassword = function (password, salt) {
  let hash = crypto.createHash('sha256')
  hash.update(password)
  hash.update(salt)
  return hash.digest('hex')
}

module.exports = {
  'init': init,
  'login': login,
  'register': register,
  'manageUser': manageUser,
  'forgotPassword': forgotPassword,
  'authenticatePage': authenticatePage,
  'authenticateApi': authenticateApi,
  'userFromId': userFromId,
  'userFromSession': userFromSession,
  'userFromResetPasswordToken': userFromResetPasswordToken,
  'addUser': addUser,
  'resetPassword': resetPassword
}
