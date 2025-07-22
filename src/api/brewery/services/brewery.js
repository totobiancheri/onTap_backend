'use strict';

/**
 * brewery service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::brewery.brewery');
