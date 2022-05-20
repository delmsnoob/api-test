const router = require('koa-router')()
const Setting = require('@store/settings')
// const Joi = require('joi')

const { copyFile, parsify } = require('@utilities/helpers')
const authentication = require('@middleware/authentication')

module.exports = router
  .prefix('/settings')

  .use(authentication())

  .get('/', async ctx => {
    try {
      ctx.body = await Setting.default()
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    try {
      const request = parsify(ctx.request.body.details)

      const files = ctx.request.files

      if (files && request.name === 'seo') {
        for (const key in files) {
          const item = files[key]

          const postImage = await copyFile(item, `/seo/${key}`)

          if (key === 'image') {
            const img = request.setting.meta.find(element => element.property === 'og:image')

            img.content = request.setting.image_path + postImage
          } else {
            const img = request.setting.meta.find(element => element.name === 'twitter:image')

            img.content = request.setting.image_path + postImage
          }
        }
      } else if (files && files.file) {
        const image = await copyFile(files.file, '')
        request.setting.image = image
      }

      request.setting = JSON.stringify(request.setting)

      ctx.body = await Setting.modify(request.id, {
        name: request.name,
        setting: request.setting
      })
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })
