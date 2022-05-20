const router = require('koa-router')()
const Content = require('@store/content')

const { copyFile } = require('@utilities/helpers')

module.exports = router
  .prefix('/content')

  .get('/:type/:id', async ctx => {
    try {
      ctx.body = await Content.list(ctx.params.id)
    } catch (err) {
      ctx.throw(err)
    }
  })
