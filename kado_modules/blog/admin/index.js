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
const K = require('../../../index')
const crypto = require('crypto')

const sequelize = K.db.sequelize

const Blog = sequelize.models.Blog
const BlogRevision = sequelize.models.BlogRevision


/**
 * List blogs
 * @param {object} req
 * @param {object} res
 */
exports.list = (req,res) => {
  if(!req.query.length){
    res.render(res.locals._view.get('blog/list'),{
      _pageTitle: K._l.blog.blog + ' ' + K._l.list})
  } else {
    K.datatable(Blog,req.query)
      .then((result) => {
        res.json(result)
      })
      .catch((err) => {
        res.json({error: err.message})
      })
  }
}


/**
 * Create entry
 * @param {object} req
 * @param {object} res
 */
exports.create = (req,res) => {
  res.render(res.locals._view.get('blog/create'),{
    _pageTitle: K._l.blog.blog + ' ' + K._l.create})
}


/**
 * Edit
 * @param {object} req
 * @param {object} res
 */
exports.edit = (req,res) => {
  Blog.findOne({where: {id: req.query.id}})
    .then((result) => {
      if(!result) throw new Error(K._l.blog_entry_not_found)
      result.content = K.base64js.fromByteArray(
        new Buffer(result.content,'utf-8'))
      res.render(res.locals._view.get('blog/edit'),{
        blog: result, _pageTitle: K._l.edit + ' ' + K._l.blog.blog})
    })
    .catch((err) => {
      res.render(res.locals._view.get('error'),{error: err})
    })
}


/**
 * Save
 * @param {object} req
 * @param {object} res
 */
exports.save = (req,res) => {
  let data = req.body
  let hash
  let blog
  let isNewRevision = false
  let isNew = false
  let json = K.isClientJSON(req)
  Blog.findOne({where: {id: data.id}})
    .then((result) => {
      blog = result
      if(!blog){
        isNew = true
        blog = Blog.build({
          content: '',
          html: ''
        })
      }
      if(data.title) blog.title = data.title
      if(data.uri) blog.uri = data.uri
      if('undefined' === typeof data.active) blog.active = false
      if(data.active) blog.active = true
      //first hash them
      if(!data.content) data.content = ''
      if(!data.html) data.html = ''
      let cipher = crypto.createHash('sha256')
      hash = cipher.update(data.content + data.html).digest('hex')
      return BlogRevision.findOne({where: {hash: hash, BlogId: blog.id}})
    })
    .then((result) => {
      if(!result){
        isNewRevision = true
        let revParams = {
          content: data.content,
          html: data.html,
          hash: hash,
          BlogId: blog.id
        }
        return BlogRevision.create(revParams)
      } else {
        return result
      }
    })
    .then(() => {
      blog.content = data.content
      blog.html = data.html
      return blog.save()
    })
    .then((blog) => {
      if(json){
        res.json({blog: blog.dataValues})
      } else {
        req.flash('success',{
          message: K._l.blog.blog_entry + ' ' +
            (isNew ? K._l.created : K._l.saved),
          href: '/blog/edit?id=' + blog.id,
          name: blog.id
        })
        res.redirect('/blog/list')
      }
    })
    .catch((err) => {
      if(json){
        res.json({error: err.message})
      } else {
        res.render(res.locals._view.get('error'),{error: err})
      }
    })
}


/**
 * Process removals
 * @param {object} req
 * @param {object} res
 */
exports.remove = (req,res) => {
  let json = K.isClientJSON(req)
  if(req.query.id) req.body.remove = req.query.id.split(',')
  if(!(req.body.remove instanceof Array)) req.body.remove = [req.body.remove]
  K.modelRemoveById(Blog,req.body.remove)
    .then(() => {
      if(json){
        res.json({success: K._l.blog.blog_removed})
      } else {
        req.flash('success',K._l.blog.blog_removed)
        res.redirect('/blog/list')
      }
    })
    .catch((err) => {
      if(json){
        res.json({error: err.message || K._l.blog.blog_removal_error})
      } else {
        res.render(res.locals._view.get('error'),{error: err.message})
      }
    })
}
