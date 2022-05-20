const store = require('@store')
const { map } = require('lodash')

// libs
const _isEmpty = require('lodash/isEmpty')
const _isNil = require('lodash/isNil')

module.exports = {
  async modify (id, payload) {
    try {
      const dictionary = {
        setting: 'sd.setting'
      }

      const updateData = {}
      for (const key in payload) {
        const updateValue = payload[key]
        const currDictionary = dictionary[key]

        if (_isNil(updateValue) || !currDictionary) {
          continue
        }

        updateData[currDictionary] = updateValue
      }

      if (_isEmpty(updateData)) {
        return
      }

      const query = await store.knex({ sd: 'setting_default' })
        .where('sd.id', id)
        .update(updateData)

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  async list () {
    try {
      const query = await store.knex('setting_default')
        .where('setting_default.name', 'seo')
        .select({
          id: 'setting_default.id',
          name: 'setting_default.name',
          setting: 'setting_default.setting'
        })
        .first()

      if (query.setting !== undefined) {
        query.setting = JSON.parse(query.setting)
      }

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  async store () {
    try {
      const tags = await store.knex('tags')
        .select({
          name: 'tags.name'
        })
        .whereNull('tags.deleted_at')

      const tagList = tags.map(x => x.name)
      const keywordList = tagList.join()

      const query = await store.knex('setting_default')
        .where('setting_default.name', 'seo')
        .select({
          id: 'setting_default.id',
          name: 'setting_default.name',
          setting: 'setting_default.setting'
        })
        .first()

      if (query.setting !== undefined) {
        query.setting = JSON.parse(query.setting)
      }

      for (const key in query.setting.meta) {
        if (Object.hasOwnProperty.call(query.setting.meta, key)) {
          const element = query.setting.meta[key]

          if (element.name && element.name === 'keywords') {
            element.content = keywordList
          }
        }
      }

      query.setting = JSON.stringify(query.setting)

      const pay = query.setting

      const seoId = query.id
      delete query.name
      delete query.id

      this.modify(seoId, { setting: pay })

      return query
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
