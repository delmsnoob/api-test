const store = require('@store')
const PostsTag = require('@store/posts-tag')
const PostsMenu = require('@store/posts-menu')

// utilities
const CustomError = require('@utilities/custom-error')
const { raw, jsonObject } = require('@utilities/knex-helper')
const { makeQuery } = require('@utilities/knex-helper')

// libs
const _isUndefined = require('lodash/isUndefined')
const _isEmpty = require('lodash/isEmpty')

module.exports = {
  async list ({ filterBy, q, page, rows, sortBy, sort, isCount, status, id, menuId, tagId, adminId, position }) {
    const filterDictionary = {
      title: 'posts.title',
      site_name: 'posts.site_name',
      menu_name: 'menu.name'
    }

    const sortDictionary = {
      id: 'posts.id',
      order: 'posts.order'
    }

    try {
      const query = await store.knex('posts')
        .leftJoin({ pt: 'posts_tag' }, 'pt.post_id', 'posts.id')
        .leftJoin('tags', 'tags.id', 'pt.tag_id')
        .leftJoin({ pm: 'posts_menu' }, 'pm.post_id', 'posts.id')
        .leftJoin('menu', 'menu.id', 'pm.menu_id')
        .groupBy('pm.menu_id', 'posts.id')

        .modify(knex => {
          makeQuery({
            ...{ filterBy, q, filterDictionary },
            ...{ sortBy, sort, sortDictionary },
            ...{ page, rows },
            knex,

            isCount
          })

          if (id) {
            knex.where('posts.id', id)
          }

          if (adminId) {
            knex.leftJoin('admins', 'admins.id', 'posts.admin_id')
              .select({
                admin_id: 'posts.admin_id',
                created_at: 'posts.created_at',
                updated_at: 'posts.updated_at'
              })

            if (position && position !== 'all') {
              knex.where('posts.position', position)
            }
          }

          switch (status) {
            case 'inactive':
              knex.whereNull('posts.deleted_at')
                .where('posts.is_show_post', 0)
              break

            case 'deleted':
              knex.whereNotNull('posts.deleted_at')
                .select({
                  deleted_at: 'posts.deleted_at'
                })
              break

            case 'all':
              knex.whereNull('posts.deleted_at')
              break

            case 'active':
              knex.whereNull('posts.deleted_at')
                .where(qb => {
                  return qb.where('posts.is_show_post', 1)
                })
              break

            default:
              break
          }

          if (menuId) {
            knex.where('pm.menu_id', menuId)
              .where('posts.is_show_post', 1)
              .whereNull('posts.deleted_at')
          } else if (tagId) {
            knex.where('pt.tag_id', tagId)
              .where('posts.is_show_post', 1)
              .whereNull('posts.deleted_at')
          }

          if (isCount) {
            knex.select({ total: raw('COUNT(posts.id)over()') })
              .first()
          } else {
            knex.select({
              id: 'posts.id',
              site_name: 'posts.site_name',
              title: 'posts.title',
              url: 'posts.url',
              description: 'posts.description',
              // buttons: 'posts.buttons',
              content: 'posts.content',
              image_post: 'posts.image_post',
              image_banner: 'posts.image_banner',
              position: 'posts.position',
              tags: raw(`JSON_ARRAYAGG(${jsonObject({
                id: 'tags.id',
                name: 'tags.name'
              })})`),
              menu: 'menu.id',
              order: 'posts.order',
              is_featured: 'posts.is_featured',
              is_show_post: 'posts.is_show_post',
              is_show_banner: 'posts.is_show_banner',
              created_at: 'posts.created_at'
            })
          }
        })

      if (!query) {
        return
      }

      for (let i = 0; i < query.length; i++) {
        const element = query[i]
        // element.buttons = JSON.parse(element.buttons)
        element.content = JSON.parse(element.content)

        if (element.image_banner) {
          element.image_banner = element.image_banner.replace(/\\/g, '/')
        }

        if (element.image_post) {
          element.image_post = element.image_post.replace(/\\/g, '/')
        }
      }

      if (id) {
        return query[0]
      }

      return query
    } catch (error) {
      console.log(error)
      throw CustomError(error)
    }
  },

  async store (payload) {
    const errDefaults = { name: 'CREATE_ERROR', status: 400 }

    try {
      const query = await store.knex('posts')
        .insert(payload)

      return query
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

  async modify (id, payload) {
    try {
      const menuId = payload.menu
      const tagList = payload.tags

      const dictionary = {
        url: 'posts.url',
        title: 'posts.title',
        site_name: 'posts.site_name',
        description: 'posts.description',
        position: 'posts.position',
        is_show_post: 'posts.is_show_post',
        is_show_banner: 'posts.is_show_banner',
        is_featured: 'posts.is_featured',
        content: 'posts.content',
        order: 'posts.order',
        image_banner: 'posts.image_banner',
        image_post: 'posts.image_post',
        // buttons: 'posts.buttons',
        deleted_at: 'posts.deleted_at'
      }

      const updateData = {}
      for (const key in payload) {
        const updateValue = payload[key]
        const currDictionary = dictionary[key]

        if (_isUndefined(updateValue) || !currDictionary) {
          continue
        }

        updateData[currDictionary] = updateValue
      }

      if (_isEmpty(updateData)) {
        return
      }

      const query = await store.knex('posts')
        .where('posts.id', id)
        .update(updateData)

      if (menuId) {
        await PostsMenu.modify({
          menuId: menuId,
          postId: id
        })
      }

      if (tagList && typeof tagList !== 'string') {
        const finalTags = tagList.map(x => {
          return {
            tag_id: x.id,
            post_id: id
          }
        })

        await PostsTag.delete(id)

        await PostsTag.store(finalTags)
      }

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
