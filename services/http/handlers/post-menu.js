const router = require('koa-router')()

const PostsMenu = require('@store/posts-menu')
const _get = require('lodash/get')

module.exports = router
  .prefix('/posts-menu')

  .get('/', async ctx => {
    try {
      const query = ctx.request.query

      const params = {
        filterBy: query.filterBy,
        q: query.q,
        page: query.page,
        rows: query.rows,
        sortBy: query.sort_by,
        sort: query.sort,
        status: query.status
      }

      const count = await PostsMenu.list({ ...params, isCount: true })

      const list = await PostsMenu.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })
