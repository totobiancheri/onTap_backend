'use strict';
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({

  // Apri un nuovo ordine
 async open(ctx) {
   const { breweryId, customer_name } = ctx.request.body;
   if (!breweryId) return ctx.badRequest('breweryId è obbligatorio');

   const order = await strapi.entityService.create('api::order.order', {
     data: {
       status: 'aperta',
       timestamp_apertura: new Date(),
       brewery: breweryId,
       customer_name: customer_name || null,
       total: 0,
     },
   });

   return order;
 },


  // Aggiungi item (gestisce sia prodotti a prezzo fisso che spine con formato)
  async addItem(ctx) {
    const { orderId, productId, quantity, unit_price, size, connectedKegId } = ctx.request.body;

    if (!orderId || !productId || !quantity) {
      return ctx.badRequest('orderId, productId e quantity sono obbligatori');
    }

    const qty = Number(quantity);
    const unitPrice = Number(unit_price || 0);

    // 1) Cerca se esiste già un item compatibile (stessa chiave logica)
    // Chiave: order + product + (connectedKegId || null) + (size || null) + unit_price
    // (in genere unit_price conviene includerlo per non sommare prezzi diversi)
    const filters = {
      order: { id: orderId },
      product: { id: productId },
      unit_price: unitPrice,
    };
    if (connectedKegId) {
      filters.connected_keg = { id: connectedKegId };
    } else {
      filters.connected_keg = { id: { $null: true } };
    }
    if (size !== undefined && size !== null && size !== "") {
      // salva come stringa o numero a seconda del tuo model:
      filters.size = String(size);
    } else {
      filters.size = { $null: true };
    }

    const existing = await strapi.entityService.findMany('api::order-item.order-item', {
      filters,
      limit: 1,
    });

    let orderItem;

    if (existing && existing.length > 0) {
      // 2) aggiorna riga esistente (accorpa quantità e totale)
      const current = existing[0];
      const newQty = Number(current.quantity) + qty;
      const newTotal = newQty * unitPrice;

      orderItem = await strapi.entityService.update('api::order-item.order-item', current.id, {
        data: {
          quantity: newQty,
          total_price: newTotal,
        },
      });
    } else {
      // 3) crea nuova riga
      const total_price = qty * unitPrice;
      orderItem = await strapi.entityService.create('api::order-item.order-item', {
        data: {
          order: orderId,
          product: productId,
          connected_keg: connectedKegId || null,
          size: size !== undefined && size !== null && size !== "" ? String(size) : null,
          quantity: qty,
          unit_price: unitPrice,
          total_price,
        },
      });
    }

    // 4) se collegato a un fusto, scala i litri (qty * size)
    if (connectedKegId && size) {
      const litersToSubtract = Number(size) * qty;
      const keg = await strapi.entityService.findOne('api::connected-keg.connected-keg', connectedKegId, {});
      const remaining = Number(keg.quantity_remaining || 0) - litersToSubtract;

      await strapi.entityService.update('api::connected-keg.connected-keg', connectedKegId, {
        data: {
          quantity_remaining: remaining < 0 ? 0 : remaining,
          is_active: remaining > 0,
        },
      });
    }

    // 5) ricalcola totale ordine
    const order = await strapi.entityService.findOne('api::order.order', orderId, {
      populate: ['order_items'],
    });
    const newTotal = (order.order_items || []).reduce((sum, it) => sum + Number(it.total_price || 0), 0);

    await strapi.entityService.update('api::order.order', orderId, { data: { total: newTotal } });

    return orderItem;
  }
,

  // Chiudi ordine
  async close(ctx) {
    const { id } = ctx.params;
    const order = await strapi.entityService.update('api::order.order', id, {
      data: {
        status: 'chiusa',
        timestamp_chiusura: new Date()
      }
    });
    return order;
  },

}));
