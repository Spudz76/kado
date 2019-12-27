'use strict';
/**
 * Kado - Web Application System
 * Copyright © 2015-2019 Bryan Tong, NULLIVEX LLC. All rights reserved.
 * Kado <support@kado.org>
 *
 * This file is part of Kado and bound to the MIT license distributed within.
 */
const path = require('path')
const libRoot = path.resolve(path.join(__dirname,'..'))
const root = path.resolve(path.join(__dirname,'..','..'))

module.exports = class Config {
  constructor(){
    this.dev = null
    this.title = 'Kado'
    this.pageTitle = 'Kado'
    this.name = 'kado'
    this.instanceName = null
    this.autoSaveInstance = true
    this.userModuleFolderName = 'modules'
    this.version = require(
      path.resolve(path.join(root,'package.json'))).version
    this.log = {
      dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
        winston: {
        enabled: true,
      default: true,
          root: path.resolve(path.join(libRoot,'logger','winston.js')),
          transport: {
          console: {
            enabled: true,
              level: null
          },
          file: {
            enabled: false,
              level: null,
              filename: null
          }
        }
      }
    }
    //interface options that got moved
    this.baseUrl = ''
    this.viewCache = true
    this.view = {}
    this.library = []
    this.libraryPaths = []
    this.scriptServer = []
    this.staticRoot = []
    this.addCss = []
    this.removeCss = []
    this.addScript = []
    this.removeScript = []
    this.languagePacks = [
      path.resolve(path.join(root,'lang','eng.js')),
      path.resolve(path.join(root,'lang','spa.js')),
    ]
    this.override = {
      languagePacks: [],
        lang: {},
      library: [],
        libraryPaths: [],
        nav: {},
      permission: {allowed: {}, available: []},
      uri: {},
      view: {}
    }
    //search support
    this.search = {
      enabled: false
    }
    //session support
    this.session = {
      enabled: false,
        enableFlash: false,
        enableLogin: false,
        allowedUri: [], //when login required, still let the public use these
        tableModel: null,
        cookie: {
        secret: 'kado',
          maxAge: 2592000000
      }
    }
    //view rendering support
    this.render = {
      enabled: false,
        viewCache: false,
        mustache: {
        enabled: false,
          root: path.resolve(path.join(libRoot,'view','mustache.js'))
      }
    }
    //dynamic connectors
    this.connector = {
      stretchfs: {
        load: false,
          root: path.resolve(path.join(libRoot,'connector','stretchfs.js')),
          callback: {
          method: 'post',
            url: 'http://localhost:8160/file/jobUpdate',
            rejectUnauthorized: false
        },
        referrer: ['localhost'],
          domain: 'localhost:8162',
          token: 'changeme',
          host: 'localhost',
          port: 8161,
          username: '',
          password: ''
      }
    }
    //database connectors
    this.db = {
      modelInit: null,
        sequelize: {
        enabled: false,
          load: false,
          root: path.resolve(path.join(libRoot,'database','sequelize.js')),
          skipConnect: false,
          name: 'kado',
          host: '127.0.0.1',
          port: 3306,
          user: '',
          password: '',
          logging: false,
          skipLoggingTable: ['Session'],
          benchmark: false,
          slowQueryTime: 10000,
          dialect: 'mysql',
          options: {}
      }
    }
    //email connectors
    this.emailConfig = {
      notifyTo: 'Kado <kado@localhost>',
        notifyCc: '',
        replyTo: 'Kado <kado@localhost>',
        defaultFrom: 'Kado <kado@localhost>',
        defaultSubject: 'Email from Kado',
        log:{
        enable: false,
          file: '/var/log/emailinfo'
      }
    }
    this.email = {
      emailjs: {
        enabled: false,
          load: true,
          root: path.resolve(path.join(libRoot,'email','emailjs.js')),
          user: 'kado@localhost',
          password: '',
          host: 'localhost',
          port: null,
          ssl: false,
          tls: false,
          timeout: null
      }
    }
    this.module = {}
  }
}