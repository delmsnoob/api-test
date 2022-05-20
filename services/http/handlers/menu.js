const router = require('koa-router')()
const Menu = require('@store/menu')
const Joi = require('joi')
const _get = require('lodash/get')

const { copyFile, parsify } = require('@utilities/helpers')

const authentication = require('@middleware/authentication')

module.exports = router
  .prefix('/menu')

  .use(authentication())

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
        status: query.status,
        id: query.id,
        adminId: ctx.user.id
      }

      const count = await Menu.list({ ...params, isCount: true })

      const list = await Menu.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    const schema = Joi.object({
      name: Joi.string()
        .lowercase()
        .required(),
      content: Joi.object()
        .optional()
    })

    try {
      const files = ctx.request.files
      const body = parsify(ctx.request.body.details)

      if (files) {
        for (const key in files) {
          const item = files[key]

          const postImage = await copyFile(item, `/menu/${key}`)

          body.content[key] = postImage
        }
      }
      const request = await schema.validateAsync(body)

      ctx.body = await Menu.store({
        admin_id: 1,
        name: request.name,
        content: request.content
      })
    } catch (err) {
      ctx.throw(err)
      console.log(err)
    }
  })

  .patch('/', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required(),
      admin_id: Joi.number()
        .required(),
      name: Joi.string()
        .required(),
      content: Joi.object()
        .optional()
    })

    try {
      const files = ctx.request.files
      const body = parsify(ctx.request.body.details)

      if (files) {
        for (const key in files) {
          const item = files[key]

          const postImage = await copyFile(item, `/menu/${key}`)

          body.content[key] = postImage
        }
      }

      const request = await schema.validateAsync(body)

      ctx.body = await Menu.modify([request.id], {
        name: request.name,
        content: request.content
      })
    } catch (err) {
      ctx.throw(err)
    }
  })

  .delete('/', async ctx => {
    try {
      ctx.body = await Menu.modify(ctx.request.body, {
        deleted_at: new Date()
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/restore/', async ctx => {
    try {
      ctx.body = await Menu.modify(ctx.request.body, {
        deleted_at: null
      })
      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })
