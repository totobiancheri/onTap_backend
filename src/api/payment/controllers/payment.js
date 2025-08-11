'use strict';
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::payment.payment', ({ strapi }) => ({
  async createForOrder(ctx) {
    const orderId = ctx.params.id;
    const { method, amount_cents, status = 'SETTLED', meta = {}, allocations = [] } = ctx.request.body || {};
    if (!method || typeof amount_cents !== 'number') return ctx.badRequest('method and amount_cents required');

    // TODO (consigliato): validazioni business (no over-allocation, no over-payment)
    const entry = await strapi.entityService.create('api::payment.payment', {
      data: { order: orderId, method, amount_cents, status, meta, allocations },
      populate: ['order','allocations','allocations.order_item']
    });
    ctx.body = entry;
  },

  async findForOrder(ctx) {
    const orderId = ctx.params.id;
    const list = await strapi.entityService.findMany('api::payment.payment', {
      filters: { order: { id: orderId }, status: { $ne: 'VOID' } },
      sort: { createdAt: 'asc' },
      populate: ['allocations','allocations.order_item']
    });
    ctx.body = list;
  },

  async void(ctx) {
    const id = ctx.params.id;
    const entry = await strapi.entityService.update('api::payment.payment', id, {
      data: { status: 'VOID' },
      populate: ['allocations','allocations.order_item']
    });
    ctx.body = entry;
  }
}));
