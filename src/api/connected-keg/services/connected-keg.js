'use strict';

/**
 * connected-keg service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::connected-keg.connected-keg');
