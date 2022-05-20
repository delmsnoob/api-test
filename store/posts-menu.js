const store = require('@store')

// utilities
const { raw, jsonObject, makeQuery } = require('@utilities/knex-helper')
const CustomError = require('@utilities/custom-error')

// libs
const _isNil = require('lodash/isNil')
const _castArray = require('lodash/castArray')
const _pickBy = require('lodash/pickBy')

module.exports = {
  async list ({ page, rows, isCount }) {
    try {
      const menu = await store.knex('menu')
        .leftJoin({ pm: 'posts_menu' }, 'pm.menu_id', 'menu.id')
        .leftJoin('posts', 'pm.post_id', 'posts.id')
        .groupBy('menu.id')
        .whereNull('menu.deleted_at')
        .whereNull('posts.deleted_at')
        .modify(knex => {
          makeQuery({
            ...{ page, rows },
            knex,
            isCount
          })

          if (isCount) {
            knex.select({ total: raw('COUNT(menu.id)over()') }).first()
          } else {
            knex.select({
              id: 'menu.id',
              name: 'menu.name',
              subNav: raw(`JSON_ARRAYAGG(${jsonObject({
                id: 'posts.id',
                site_name: 'posts.site_name',
                url: 'posts.url',
                status: 'posts.is_show_post',
                featured: 'posts.is_featured'
              })})`)
            })
          }
        })

      for (let i = 0; i < menu.length; i++) {
        const element = menu[i]
        let countNav = JSON.parse(element.subNav)

        countNav = countNav.filter(x => x.id && x.status && x.featured === 1)

        element.countNav = countNav.length
        element.subNav = countNav
      }

      return menu
    } catch (error) {
      console.log(error)
    }
  },

  async store (payload) {
    const errDefaults = { name: 'CREATE_ERROR', status: 400 }

    const fillables = new Set([
      'menu_id',
      'post_id'
    ])
    try {
      const arrayPayload = _castArray(payload)
      const filterer = hay => _pickBy(hay, (val, key) => !_isNil(val) && fillables.has(key))
      const data = arrayPayload.map(filterer)

      const [id] = await store.knex('posts_menu').insert(data)

      return id
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new CustomError({ ...errDefaults, message: 'DUPLICATE', info: error.sqlMessage })
      }

      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new CustomError({ ...errDefaults, message: 'UNKNOWN_DATA' })
      }

      throw error
    }
  },

  async modify ({ menuId, postId }) {
    try {
      const query = await store.knex({ pm: 'posts_menu' })
        .where('pm.post_id', postId)
        .select('pm.menu_id')
        .first()

      if (query && query.menu_id) {
        return store.knex({ pm: 'posts_menu' })
          .where('pm.post_id', postId)
          .update({
            menu_id: menuId
          })
      }

      return await store.knex('posts_menu')
        // .where('pm.post_id', postId)
        .insert({
          post_id: parseInt(postId),
          menu_id: parseInt(menuId)
        })
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
