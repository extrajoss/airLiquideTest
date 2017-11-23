const config = require('homebase/common/config')
const ecache = require('./server/ensureProcessingCache.js')
const uniprotHelpers = require('./server/uniprotHelpers.js')
const authentication = require('./server/authentication.js')
const baseApp = require('homebase/app')

var app = baseApp.setup()

authentication.init(app)

app.get('/favicon.ico', function (req, res) {
  res.sendStatus(204)
})

app.post('/login',
    function (res, req, next) {
      let login = authentication.login(res, req, next)
      return login(res, req, next)
    }
)

app.get('/login', function (req, res) {
  let flashMessage = req.flash('loginMessage')
  const email = req.flash('loginEmail')
  res.render('login', { email: email, message: flashMessage })
})

app.post('/register',
    function (res, req, next) {
      let register = authentication.register(res, req, next)
      return register(res, req, next)
    }
)

app.get('/register', function (req, res) {
  const flashMessage = req.flash('registerMessage')
  const fullname = req.flash('registerFullname')
  const email = req.flash('registerEmail')
  res.render('register', { fullname: fullname, email: email, message: flashMessage })
})

app.post('/manageUser', authentication.authenticatePage,
  async function (res, req, next) {
    const manageUser = await authentication.manageUser(res, req, next)
    return manageUser(res, req, next)
  }
)

app.get('/manageUser', authentication.authenticatePage,
  async function (req, res) {
    const flashMessage = req.flash('manageUserMessage')
    const user = await authentication.userFromSession(req.session)
    const fullname = user.fullname
    const email = user.email
    res.render('manageUser', { fullname: fullname, email: email, message: flashMessage })
  }
)

app.get('/reset/:token',
  async function (req, res) {
    const userByToken = await authentication.userFromResetPasswordToken(req.params.token)
    if (!userByToken) {
      req.flash('loginMessage', 'Password reset token is invalid or has expired.')
      return res.redirect('/login')
    }
    const flashMessage = 'Please enter a new password'
    res.render('reset', { fullname: userByToken.fullname, email: userByToken.email, reset_password_token: req.params.token, message: flashMessage })
  })

app.post('/reset/:token', async function (res, req, next) {
  const resetPassword = await authentication.resetPassword(res, req, next)
  return resetPassword(res, req, next)
})

app.get('/forgotPassword',
async function (req, res, next) {
  const flashMessage = req.flash('forgotPasswordMessage')
  res.render('forgotPassword', { email: '', message: flashMessage })
}
)

app.post('/forgotPassword',
async function (req, res, next) {
  let forgotPassword = await authentication.forgotPassword(req, res, next)
  return forgotPassword(req, res, next)
}
)

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

const getPdb = function (req) {
  if (req.query.pdb && req.query.pdb.length === 4) {
    return req.query.pdb
  }
  if (req.query.pdb2 && req.query.pdb2.length === 4) {
    return req.query.pdb2
  }
}

const isDefault = function (currentSpreadsheet, defaultSpreadsheet) {
  return (
        currentSpreadsheet.element === defaultSpreadsheet.element &&
        currentSpreadsheet.ligand === defaultSpreadsheet.ligand &&
        currentSpreadsheet.energy === defaultSpreadsheet.energy
  )
}

app.get('/', authentication.authenticatePage,
    async function (req, res) {
      const user = await authentication.userFromSession(req.session)
      let pdb = getPdb(req)
      if (pdb) {
        res.redirect('/' + pdb + '?cutoff=high')
      } else {
        res.render(
        'overview',
          {
            isDefault: isDefault,
            defaultSpreadsheet: config.get('web').defaultSpreadsheet,
            spreadsheet: config.get('web').spreadsheet,
            baseWebsite: config.get('web').baseWebsite,
            defaultPDB: req.query.pdb,
            user: user
          }
        )
      }
    }
)

app.get(
    '/:pdb/', authentication.authenticatePage,
    function (req, res) {
      res.render(
            'jolecule',
        {
          pdb: req.params.pdb,
          energyCutoffSet: req.query.cutoff || Object.keys(config.get('jolecule').ENERGY_CUTOFF_SETS)[0]
        }
        )
    }
)

app.get(
    '/getUniprot/:uniprot', authentication.authenticateApi,
    async function (req, res) {
      let fileName = await uniprotHelpers.getUniProtFile(req.params.uniprot)
      let csvResults = await uniprotHelpers.parseCSV(fileName)
      Promise.all(csvResults.mapFileChecks)
            .then((fileNames) => {
              csvResults.fileNames = fileNames
              for (var key in csvResults.fileNames) {
                csvResults.clusters[key].fileName = csvResults.fileNames[key]
              }
              res.write(JSON.stringify(csvResults.clusters))
              res.end()
            })
    })

app.get(
    '/getMaps/:pdb/:energyCutoffSet/', authentication.authenticateApi,
    function (req, res) {
      ecache.checkFilesAndReturnJSON(req, res)
    })

app.get(
    '/flushCache/:pdb/:energyCutoffSet/', authentication.authenticateApi,
    function (req, res) {
      ecache.flushCache(req, res)
    })
app.get(
    '/data/:pdb/:energyCutoffSet/:index/', authentication.authenticateApi,
    async function (req, res) {
      try {
        let dataServer = ecache.retrieveCache(req, res)
        res.setHeader('content-type', 'text/javascript')
        res.write(await dataServer)
        res.end()
      } catch (err) {
        res.status(404).send(err)
      }
    })

app.use(function (req, res) {
  res.redirect('/login')
})

module.exports = app
