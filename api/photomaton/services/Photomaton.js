/* global Photomaton */
'use strict';

/**
 * Photomaton.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');


module.exports = {

  /**
   * Promise to fetch all photomatons.
   *
   * @return {Promise}
   */

  fetchAll: (params, populate) => {
    // Select field to populate.
    const withRelated = populate || Photomaton.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const filters = convertRestQueryParams(params);

    return Photomaton.query(buildQuery({ model: Photomaton, filters }))
      .fetchAll({ withRelated })
      .then(data => data.toJSON());
  },

  /**
   * Promise to fetch a/an photomaton.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Photomaton.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    return Photomaton.forge(_.pick(params, 'id')).fetch({
      withRelated: populate
    });
  },

  /**
   * Promise to count a/an photomaton.
   *
   * @return {Promise}
   */

  count: (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = convertRestQueryParams(params);

    return Photomaton.query(buildQuery({ model: Photomaton, filters: _.pick(filters, 'where') })).count();
  },

  /**
   * Promise to add a/an photomaton.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Photomaton.associations.map(ast => ast.alias));
    const data = _.omit(values, Photomaton.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Photomaton.forge(data).save();

    // Create relational data and return the entry.
    return Photomaton.updateRelations({ id: entry.id , values: relations });
  },

  /**
   * Promise to edit a/an photomaton.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Photomaton.associations.map(ast => ast.alias));
    const data = _.omit(values, Photomaton.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Photomaton.forge(params).save(data);

    // Create relational data and return the entry.
    return Photomaton.updateRelations(Object.assign(params, { values: relations }));
  },

  /**
   * Promise to remove a/an photomaton.
   *
   * @return {Promise}
   */

  remove: async (params) => {
    params.values = {};
    Photomaton.associations.map(association => {
      switch (association.nature) {
        case 'oneWay':
        case 'oneToOne':
        case 'manyToOne':
        case 'oneToManyMorph':
          params.values[association.alias] = null;
          break;
        case 'oneToMany':
        case 'manyToMany':
        case 'manyToManyMorph':
          params.values[association.alias] = [];
          break;
        default:
      }
    });

    await Photomaton.updateRelations(params);

    return Photomaton.forge(params).destroy();
  },

  /**
   * Promise to search a/an photomaton.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = strapi.utils.models.convertParams('photomaton', params);
    // Select field to populate.
    const populate = Photomaton.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const associations = Photomaton.associations.map(x => x.alias);
    const searchText = Object.keys(Photomaton._attributes)
      .filter(attribute => attribute !== Photomaton.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['string', 'text'].includes(Photomaton._attributes[attribute].type));

    const searchInt = Object.keys(Photomaton._attributes)
      .filter(attribute => attribute !== Photomaton.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['integer', 'decimal', 'float'].includes(Photomaton._attributes[attribute].type));

    const searchBool = Object.keys(Photomaton._attributes)
      .filter(attribute => attribute !== Photomaton.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['boolean'].includes(Photomaton._attributes[attribute].type));

    const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

    return Photomaton.query(qb => {
      if (!_.isNaN(_.toNumber(query))) {
        searchInt.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
        });
      }

      if (query === 'true' || query === 'false') {
        searchBool.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
        });
      }

      // Search in columns with text using index.
      switch (Photomaton.client) {
        case 'mysql':
          qb.orWhereRaw(`MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`, `*${query}*`);
          break;
        case 'pg': {
          const searchQuery = searchText.map(attribute =>
            _.toLower(attribute) === attribute
              ? `to_tsvector(${attribute})`
              : `to_tsvector('${attribute}')`
          );

          qb.orWhereRaw(`${searchQuery.join(' || ')} @@ to_tsquery(?)`, query);
          break;
        }
      }

      if (filters.sort) {
        qb.orderBy(filters.sort.key, filters.sort.order);
      }

      if (filters.skip) {
        qb.offset(_.toNumber(filters.skip));
      }

      if (filters.limit) {
        qb.limit(_.toNumber(filters.limit));
      }
    }).fetchAll({
      withRelated: populate
    });
  }
};
