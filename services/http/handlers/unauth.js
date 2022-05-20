const router = require('koa-router')()
const About = require('@store/about')
const Reviews = require('@store/review')
const Tag = require('@store/tag')
const PostTag = require('@store/posts-tag')
const Banner = require('@store/banner')
const Post = require('@store/post')
const Menu = require('@store/menu')
const Seo = require('@store/seo')
const Setting = require('@store/settings')

const _get = require('lodash/get')

module.exports = router
  .prefix('/unauth')

  .get('/about', async ctx => {
    try {
      const query = ctx.request.query
      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status || 'all'
      }

      const count = await About.list({ ...params, isCount: true })

      const list = await About.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/banner', async ctx => {
    try {
      const query = ctx.request.query
      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status || 'all'
      }

      const count = await Banner.list({ ...params, isCount: true })

      const list = await Banner.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/menu', async ctx => {
    try {
      const query = ctx.request.query
      const params = {
        page: query.page,
        rows: query.rows,
        status: query.status || 'all',
        id: query.id
      }

      const count = await Menu.list({ ...params, isCount: true })

      const list = await Menu.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/post', async ctx => {
    try {
      const query = ctx.request.query

      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        id: query.id,
        menuId: query.menuId,
        tagId: query.tagId,
        status: query.status || 'all'
      }

      const count = await Post.list({ ...params, isCount: true })

      const list = await Post.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .get('/reviews', async ctx => {
    try {
      const query = ctx.request.query
      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status || 'all'
      }

      const count = await Reviews.list({ ...params, isCount: true })

      const list = await Reviews.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/seo', async ctx => {
    try {
      ctx.body = await Seo.list()
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/tag', async ctx => {
    try {
      const query = ctx.request.query

      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status || 'all'
      }

      const count = await Tag.list({ ...params, isCount: true })

      const list = await Tag.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/posts-tag', async ctx => {
    try {
      const query = ctx.request.query

      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status || 'all'
      }

      const count = await PostTag.list({ ...params, isCount: true })

      const list = await PostTag.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/settings', async ctx => {
    try {
      ctx.body = await Setting.default()
    } catch (err) {
      ctx.throw(err)
    }
  })

  .get('/featured', async ctx => {
    try {
      const query = ctx.request.query

      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        id: query.id,
        menuId: query.menuId,
        status: query.status || 'all'
      }

      const count = await Post.featuredlist({ ...params, isCount: true })

      const list = await Post.featuredlist({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })
