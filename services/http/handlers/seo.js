const router = require('koa-router')()
const Seo = require('@store/seo')

const { copyFile } = require('@utilities/helpers')

const authentication = require('@middleware/authentication')

module.exports = router
  .prefix('/seo')

  .use(authentication())

  .get('/', async ctx => {
    try {
      ctx.body = await Seo.list()
    } catch (err) {
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    try {
      const data = JSON.stringify(ctx.request.body)

      ctx.body = await Seo.store({
        name: 'seo',
        setting: data
      })
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .patch('/:id', async ctx => {
    try {
      const data = JSON.parse(ctx.request.body.details)

      const files = ctx.request.files

      if (files) {
        for (const key in files) {
          const item = files[key]

          const postImage = await copyFile(item, `/seo/${key}`)

          if (key === 'image') {
            const img = data.meta.find(element => element.property === 'og:image')

            img.content = data.image_path + postImage
          } else {
            const img = data.meta.find(element => element.name === 'twitter:image')

            img.content = data.image_path + postImage
          }
        }
      }

      delete data.image_path

      ctx.body = await Seo.modify(ctx.params.id, {
        setting: JSON.stringify(data)
      })
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })
