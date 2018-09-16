'use strict';
/**
 * Kado - Module system for Enterprise Grade applications.
 * Copyright © 2015-2018 NULLIVEX LLC. All rights reserved.
 * Kado <support@kado.org>
 *
 * This file is part of Kado.
 *
 * Kado is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kado is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kado.  If not, see <https://www.gnu.org/licenses/>.
 */
let P = require('bluebird')
let clusterSetup = require('infant').cluster
let fs = require('graceful-fs')


/**
 * Master process
 * @this {object}
 * @param {K} K
 * @param {string} interfaceName
 * @param {string} interfaceRoot
 * @return {object}
 */
exports.master = (K,interfaceName,interfaceRoot) => {
  return P.try(() => {
    let config = K.config
    let cluster
    let master = {}
    master.start = (done) => {
      cluster = clusterSetup(
        interfaceRoot + '/worker',
        {
          enhanced: true,
          count: config.interface.admin.workers.count,
          maxConnections: config.interface.admin.workers.maxConnections,
          env: {
            NODE_DEBUG: process.env.NODE_DEBUG,
            KADO_CONFIG: JSON.stringify(config.$strip())
          }
        }
      )
      cluster.start((err) => {
        done(err)
      })
    }
    master.stop = (done) => {
      if(!cluster) return done()
      cluster.stop((err) => {
        done(err)
      })
    }
    return master
  })
}


/**
 * Worker process
 * @this {object}
 * @param {K} K
 * @param {string} interfaceName
 * @param {string} interfaceRoot
 * @return {object}
 */
exports.worker = (K,interfaceName,interfaceRoot) => {
  const config = K.config
  if(!interfaceName) interfaceName = 'admin'
  if(!interfaceRoot) interfaceRoot = __dirname
  //start Kado first
  return K.init().then(() => {
    //third party requirements
    const bodyParser = require('body-parser')
    const compress = require('compression')
    const cookieParser = require('cookie-parser')
    const express = require('express')
    const expressSession = require('express-session')
    const http = require('http')
    const locale = require('locale')
    const path = require('path')
    const serveStatic = require('serve-static')
    const Breadcrumb = require('../helpers/Breadcrumb')
    const Nav = require('../helpers/Nav')
    const Permission = require('../helpers/Permission')
    const URI = require('../helpers/URI')
    const View = require('../helpers/View')
    const SequelizeStore = require('connect-session-sequelize')(
      expressSession.Store)
    //interface context
    let worker = {}
    let app = worker.app = express()
    let server = worker.server = http.createServer(app)
    //make some promises
    P.promisifyAll(server)
    //breadcrumb system
    app.breadcrumb = new Breadcrumb()
    //navigation system
    app.nav = new Nav()
    //permission system
    app.permission = new Permission()
    //uri system
    app.uri = new URI()
    //view system
    app.view = new View()
    //------------------------------------
    //TEMPLATE GLOBALS AND FUNCTIONS
    // make sure and prefix these with _
    /**
     * Global template vars
     * @type {*}
     */
    //------------------------------------
    app.locals._basedir = app.get('views')
    app.locals._moment = require('moment')
    app.locals._printDate = K.printDate
    //moment no longer supports any method of getting the short timezone
    app.locals._timezone = ['(',')'].join(
      (new Date()).toLocaleTimeString(
        'en-US',{timeZoneName:'short'}
      ).split(' ').pop()
    )
    app.locals._printDate = () => {
      return (text,render) => {
        return K.printDate(render(text),'Never')
      }
    }
    app.locals._toDateString = app.locals._printDate
    app.locals._escapeAndTruncate = (text,render) => {
      let rv = render(text)
      let parts = rv.split(',')
      if(!parts || 2 !== parts.length){
        throw new Error('Cannot parse escapeAndTruncate')
      }
      let len = parts[0], tpl = parts[1]
      tpl = tpl.replace(/<(?:.|\n)*?>/gm, '') //remove html
      return tpl.substring(0,len) //shorten
    }
    app.locals._is = () => {
      return (text,render) => {
        let parts = render(text).split(',')
        if(parts.length !== 3) throw new Error('Failed parsing _is')
        let cond = true
        if('' === parts[0] || 'false' === parts[0] || false === parts[0]){
          cond = false
        }
        return cond ? parts[1] : parts[2]
      }
    }
    app.locals._compare = () => {
      return (text,render) => {
        let parts = render(text).split(',')
        if(parts.length !== 4) throw new Error('Failed parsing _compare')
        let cond = true
        if(parts[0] !== parts[1]){
          cond = false
        }
        return cond ? parts[2] : parts[3]
      }
    }
    app.locals._capitalize = (string) => {
      return string.replace(/\b\w/g, l => l.toUpperCase())
    }
    app.locals._prettyBytes = require('pretty-bytes')
    app.locals._appName = config.name
    app.locals._appTitle = config.interface[interfaceName].title
    app.locals._version = config.version
    app.locals._currentYear = app.locals._moment().format('YYYY')
    //expose translation systems
    app.locals._breadcrumb = app.breadcrumb
    app.locals._nav = app.nav
    app.locals._uri = app.uri
    app.locals._view = app.view
    //load middleware
    app.use(compress())
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
    //nav overrides
    console.log(K.config,interfaceName)
    if(K.config[interfaceName].override.nav){
      let nav = K.config[interfaceName].override.nav
      if(nav){
        for(let n in nav){
          if(nav.hasOwnProperty(n)){
            let i = nav[n]
            if(i.group){
              app.nav.addItem(i.group,i.uri,i.name,i.icon)
            } else {
              app.nav.addGroup(i.uri,i.name,i.icon)
            }
          }
        }
      }
    }
    //system middleware
    app.use((req,res,next) => {
      //add breadcrumb links
      app.breadcrumb.crumbs = app.breadcrumb.middleware(app,req)
      //expose system vars
      res.locals._breadcrumb = app.breadcrumb
      res.locals._permission = app.permission
      res.locals._uri = app.uri
      res.locals._view = app.view
      res.locals._currentUri = req.originalUrl
      next()
    })
    worker.setupPermission = (cb) => {
      //setup permissions object
      app.locals._p = {allowed: {}, available: []}
      //add a helper function for looking up permissions from views
      app.locals._p.show = () => {return (text,render) => {
        let parts = render(text).split(',')
        if(parts.length !== 2){
          throw new Error('Invalid argument for permission show function')
        }
        if(false === app.permission.allowed(parts[0],set)){
          return ''
        } else {
          return parts[1]
        }
      }}
      app.use((req,res,next) => {
        let set
        //when a permission set is available populate the proper allowed object
        //otherwise populate the entire permission set
        app.permission.all().forEach((s) => {
          res.locals._p.available.push({
            name: s.name, description: s.description
          })
        })
        if(req.session && req.session._staff && req.session._staff.permission){
          set = req.session._staff.permission
          set.forEach((s) => {res.locals._p.allowed[s] = s})
        } else {
          app.permission.digest().forEach((s) => {res.locals._p.allowed[s] = s})
        }
        //load overrides
        let permission = K.config[interfaceName].override.permission
        if(permission){
          permission.available.forEach((a) => {
            res.locals._p.available.push({
              name: a.name, description: a.description
            })
          })
          for(let a in permission.allowed){
            if(permission.allowed.hasOwnProperty(a)){
              res.locals._p.allowed[a] = a
            }
          }
        }
        //decide whether or not to finish loading the current page
        if(false === app.permission.allowed(req.url,set)){
          res.render(res.locals._view.get('error'),{error: K._l.permdenied})
        } else {
          next()
        }
      })
      //call back
      if('function' === typeof(cb)) return cb(app,K)
    }
    worker.setupLang = (cb) => {
      //setup language support
      K.lang.scan() //this happens sync no way around it
      app.use(locale(K.lang.getSupportedSC(),K.lang.defaultSC))
      app.use((req,res,next) => {
        if(req.query.lang){
          if(req.session) req.session.lang = req.query.lang
          return res.redirect(301,req.headers.referer)
        }
        if(req.session && req.session.lang) req.locale = req.session.lang
        //actually finally load the pack
        res.locals._l = K._l = K.lang.getPack(
          req.locale,K.config[interfaceName].override.lang)
        res.locals._l._packs = K.lang.all()
        next()
      })
      if('function' === typeof(cb)) return cb(app,K)
    }
    worker.setupUri = (cb) => {
      //load uri overrides
      if(K.config[interfaceName].override.uri){
        let uri = K.config[interfaceName].override.uri || {}
        for(let u in uri){
          if(uri.hasOwnProperty(u)){
            app.uri.update(u,uri[u])
          }
        }
      }
      //uri translation
      app.use((req,res,next) => {
        //actually finally load the uri
        res.locals._u = app.uri.all()
        next()
      })
      //callback
      if('function' === typeof(cb)) return cb(app,K)
    }
    worker.enableSearch = (app) => {
      app.use((req,res,next) => {
        res.locals._searchPhrase = req.query.searchPhrase || ''
        next()
      })
      return (req,res) => {
        K.search(app,req.query.searchPhrase)
          .then((result) => {
            res.render(res.locals._view.get('search'),result)
          })
      }
    }
    // setup local js servers
    worker.setupScriptServer = (name,scriptPath) => {
      if(!scriptPath) scriptPath = name
      //try for a local path first and then a system path as a backup
      let ourScriptPath = path.resolve(
        path.join(interfaceRoot,'..','..','..','..','node_modules',scriptPath))
      //fall back to a local path if we must
      if(!fs.existsSync(ourScriptPath)){
        ourScriptPath = path.resolve(
          path.join(interfaceRoot,'..','..','node_modules',scriptPath))
      }
      if(!fs.existsSync(ourScriptPath)){
        console.log('falling back2',ourScriptPath)
      }
      app.use('/node_modules/' + name,serveStatic(ourScriptPath))
    }
    //flash handler
    worker.flashHandler = (req) => {
      return () => {
        return (text) => {
          let parts = text.split(',')
          if(parts.length > 2){
            throw new Error('Failure to parse alert template')
          }
          let level = parts[0],tpl = parts[1],out = ''
          let messages = req.flash(level)
          if(messages && messages.length){
            messages.forEach((message) => {
              if(message && message.message && message.href){
                message = message.message +
                  '&nbsp; [<a href="' + message.href + '">' +
                  (message.name || message.id || 'Click') + '</a>]'
              }
              else if(message && message.message){
                message = message.message
              }
              let msg = '      ' + tpl
              msg = msg.replace('{{level}}',level)
              msg = msg.replace('{{alert}}',message)
              out = out + msg
            })
          }
          return out
        }
      }
    }
    worker.enableHtml = (callback) => {
      if(!callback) callback = () => {}
      //npm installed scripts
      //DEFINE external public script packages here, then access them by using
      // /script/<name> such as /script/bootstrap/dist/bootstrap.min.js
      callback(app,K)
    }


    /**
     * Enable interface session handling
     * @param {function} callback
     */
    worker.enableSession = (callback) => {
      if(!callback) callback = () => {}
      app.use(cookieParser(config.interface[interfaceName].cookie.secret))
      //inject headers
      app.use((req,res,next) => {
        res.set('Cache-control','no-cache, no-store, must-revalidate')
        res.set('Pragma','no-cache')
        res.set('Expires','0')
        next()
      })
      //session setup
      app.use(expressSession({
        cookie: {
          maxAge: config.interface[interfaceName].cookie.maxAge
        },
        resave: true,
        saveUninitialized: true,
        store: new SequelizeStore({
          db: K.db.sequelize,
          table: 'StaffSession'
        }),
        secret: config.interface[interfaceName].cookie.secret || 'kado'
      }))
      callback(app,K)
    }


    /**
     * Circular callback to inject setup
     * @param {function} callback
     */
    worker.setup = (callback) => {
      if(!callback) callback = () => {}
      callback(app)
    }


    /**
     * Start interface
     * @param {function} done
     */
    worker.start = (done) => {
      //so here it is time to actually scan for modules and this is where i have
      //been on the fence about how to best go about scanning modules, should we
      //have a kado.json with a list of their names and folders or should i scan
      //and try to detect?

      //maybe do some pros and cons. ease for the auto scan, however the auto
      //scan is slower and less predictable, also less controllable. con of
      //manual is that when modules are installed they will need to run the kado
      //cli to turn them selves on which i suppose is acceptable

      //so now loop here and load modules that want to be loaded
      P.try(() =>{
        Object.keys(K.modules).forEach((modName) =>{
          let mod = K.modules[modName]
          if(mod.enabled){
            let modFile = mod.root + '/kado.js'
            let module = require(modFile)
            if('function' === typeof module[interfaceName]){
              module[interfaceName](K,app)
            }
          }
        })
      })
      .then(() => {
        return server.listenAsync(
          +config.interface[interfaceName].port,
          config.interface[interfaceName].host
        )
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
    }


    /**
     * Stop admin
     * @param {function} done
     */
    worker.stop = (done) => {
      server.close()
      done()
    }
    return worker
  })
}
