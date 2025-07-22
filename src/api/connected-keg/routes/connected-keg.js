'use strict';

/**
 * connected-keg router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::connected-keg.connected-keg');
