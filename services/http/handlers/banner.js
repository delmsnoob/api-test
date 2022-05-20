const router = require('koa-router')()
const Banner = require('@store/banner')

const { copyFile, parsify } = require('@utilities/helpers')

const _get = require('lodash/get')

module.exports = router
  .prefix('/banner')

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

      const count = await Banner.list({ ...params, isCount: true })

      const list = await Banner.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    try {
      const image = ctx.request.files || ''

      let request

      if (ctx.request.body.details) {
        request = parsify(ctx.request.body.details)
      } else {
        request = ctx.request.body
      }

      if (image.file) {
        request.image_banner = await copyFile(image.file, '/banner/image_banner/')
      }

      ctx.body = await Banner.modify(request.id, {
        is_show_banner: request.is_show_banner,
        url: request.url,
        image_banner: request.image_banner,
        position: request.position
      })
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })
