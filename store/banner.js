const store = require('@store')

// utilities
const { makeQuery } = require('@utilities/knex-helper')

module.exports = {
  async list ({ filterBy, q, page, rows, sortBy, sort, isCount, status }) {
    const filterDictionary = {
      title: 'posts.title'
    }

    const sortDictionary = {
      id: 'posts.id',
      order: 'posts.order'
    }

    try {
      const query = await store.knex('posts')
        .leftJoin('admins', 'admins.id', 'posts.admin_id')
        .whereNull('posts.deleted_at')
        .whereNotNull('posts.image_banner')
        .whereNotNull('posts.url')

        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,
            isCount
          })

          if (status === 'active') {
            knex.whereNull('posts.deleted_at')
              .where('posts.is_show_banner', 1)
              .where('posts.is_show_post', 1)
          }

          if (isCount) {
            knex.count({ total: 'posts.id' }).first()
          } else {
            knex.select({
              id: 'posts.id',
              url: 'posts.url',
              site_name: 'posts.site_name',
              image_banner: 'posts.image_banner',
              is_show_banner: 'posts.is_show_banner',
              position: 'posts.position',
              created_at: 'posts.created_at'
            })
          }
        })

      for (let i = 0; i < query.length; i++) {
        const element = query[i]

        element.image_banner = element.image_banner.replace(/\\/g, '/')
      }

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  async modify (id, payload) {
    try {
      const query = await store.knex('posts')
        .where('posts.id', id)
        .update(payload)
      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
