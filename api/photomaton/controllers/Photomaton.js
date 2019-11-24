'use strict';

/**
 * Photomaton.js controller
 *
 * @description: A set of functions called "actions" for managing `Photomaton`.
 */

module.exports = {

  /**
   * Retrieve photomaton records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.photomaton.search(ctx.query);
    } else {
      return strapi.services.photomaton.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a photomaton record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.photomaton.fetch(ctx.params);
  },

  /**
   * Count photomaton records.
   *
   * @return {Number}
   */

  count: async (ctx, next, { populate } = {}) => {
    return strapi.services.photomaton.count(ctx.query, populate);
  },

  /**
   * Create a/an photomaton record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.photomaton.add(ctx.request.body);
  },

  /**
   * Update a/an photomaton record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.photomaton.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an photomaton record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.photomaton.remove(ctx.params);
  }
};
