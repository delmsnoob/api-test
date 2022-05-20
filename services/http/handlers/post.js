const router = require('koa-router')()
const Post = require('@store/post')

const Joi = require('joi')
const _get = require('lodash/get')

const { copyFile, parsify } = require('@utilities/helpers')

// middlewares
// const authentication = require('@middleware/authentication')
const userRole = require('@middleware/userRole')

module.exports = router
  .prefix('/post')

// .use(authentication())

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
        id: query.id,
        status: query.status,
        adminId: ctx.user.id,
        position: query.position
      }

      const count = await Post.list({ ...params, isCount: true })

      const list = await Post.list({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      console.log(err)
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
        status: query.status
      }

      const count = await Post.featuredlist({ ...params, isCount: true })

      const list = await Post.featuredlist({ ...params })

      ctx.body = { count: _get(count, 'total', 0), list }
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .post('/', async ctx => {
    const schema = Joi.object({
      name: Joi.string()
        .required(),
      email: Joi.string()
        .email()
        .required(),
      post: Joi.string()
        .required()
    })

    const body = parsify(ctx.request.body.details)
    const request = await schema.validateAsync(body)

    try {
      ctx.body = await Post.store({
        // admin_id: ctx.user.id,
        author_name: request.name,
        author_email: request.email,
        author_post: request.post
      })
      console.log('handlers/post')
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .patch('/', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required(),
      admin_id: Joi.number()
        .required(),
      order: Joi.number(),
      url: Joi.string()
        .required(),
      site_name: Joi.string()
        .required(),
      title: Joi.string()
        .required(),
      description: Joi.string()
        .required(),
      // buttons: Joi.array(),
      content: Joi.string()
        .required(),
      position: Joi.string()
        .required(),
      is_show_banner: Joi.number()
        .required(),
      is_show_post: Joi.number()
        .required(),
      image_post: Joi.string()
        .required(),
      image_banner: Joi.optional(),
      menu: Joi.optional(),
      tags: Joi.optional(),
      is_featured: Joi.number()
        .optional()
    })

    try {
      const body = parsify(ctx.request.body.details)

      const files = ctx.request.files

      if (files) {
        for (const key in files) {
          const item = files[key]

          const postImage = await copyFile(item, `/banner/${key}`)

          body[key] = postImage
        }
      }

      const request = await schema.validateAsync(body)

      // request.buttons = JSON.stringify(request.buttons)

      request.content = JSON.stringify(request.content)

      ctx.body = await Post.modify(request.id, {
        url: request.url,
        title: request.title,
        site_name: request.site_name,
        description: request.description,
        position: request.position,
        is_show_post: request.is_show_post,
        is_show_banner: request.is_show_banner,
        is_featured: request.is_featured,
        image_post: request.image_post,
        image_banner: request.image_banner,
        content: request.content,
        // buttons: request.buttons,
        order: request.order,
        tags: request.tags,
        menu: request.menu
      })
    } catch (err) {
      console.log(err)
      ctx.throw(err)
    }
  })

  .delete('/:id(\\d+)', async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required()
    })

    try {
      const data = await schema.validateAsync(ctx.params)

      ctx.body = await Post.modify(data.id, {
        deleted_at: new Date(),
        status: 'delete post'
      })

      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })

  .patch('/restore/:id(\\d+)', userRole(['admin']), async ctx => {
    const schema = Joi.object({
      id: Joi.number()
        .required()
    })

    try {
      const data = await schema.validateAsync(ctx.params)

      ctx.body = await Post.modify(data.id, {
        deleted_at: null
      })

      ctx.status = 200
    } catch (err) {
      ctx.throw(err)
    }
  })
