const store = require('@store')

const { raw, jsonObject, makeQuery } = require('@utilities/knex-helper')
// utilities

module.exports = {
  async list ({ page, rows, isCount }) {
    try {
      const tag = await store.knex('tags')
        .leftJoin({ pt: 'posts_tag' }, 'pt.tag_id', 'tags.id')
        .leftJoin('posts', 'pt.post_id', 'posts.id')
        .groupBy('tags.id')
        .whereNull('tags.deleted_at')
        .whereNull('posts.deleted_at')
        .modify(knex => {
          makeQuery({
            ...{ page, rows },
            knex,
            isCount
          })

          if (isCount) {
            knex.select({ total: raw('COUNT(tags.id)over()') }).first()
          } else {
            knex.select({
              id: 'tags.id',
              name: 'tags.name',
              postList: raw(`JSON_ARRAYAGG(${jsonObject({
                id: 'posts.id',
                site_name: 'posts.site_name',
                url: 'posts.url',
                status: 'posts.is_show_post',
                featured: 'posts.is_featured'
              })})`)
            })
          }
        })

      for (let i = 0; i < tag.length; i++) {
        const element = tag[i]
        let countPost = JSON.parse(element.postList)

        countPost = countPost.filter(x => x.id && x.status)

        element.countPost = countPost.length
        element.postList = countPost
      }

      return tag
    } catch (error) {
      console.log(error)
    }
  },

  async store (payload) {
    try {
      const temp = []
      payload.forEach(element => {
        if (element?.tag_id && element?.post_id) {
          temp.push(element)
        }
      })

      const query = await store.knex('posts_tag')
        .insert(temp)

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  async delete (id) {
    try {
      const query = await store.knex({ pt: 'posts_tag' })
        .where('pt.post_id', id)
        .delete()

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
