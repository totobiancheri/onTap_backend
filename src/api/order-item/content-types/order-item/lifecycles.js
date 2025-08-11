'use strict';

/** Somma i total_price delle righe e aggiorna il totale dell'ordine */


const recomputeOrderTotal = async (orderId) => {
  if (!orderId) return;

  // Prendi TUTTE le righe dell’ordine via ORM (no SQL diretto)
  const items = await strapi.entityService.findMany('api::order-item.order-item', {
    filters: { order: { id: orderId } },
    fields: ['quantity', 'unit_price', 'total_price'], // total_price se già valorizzato
    pagination: { page: 1, pageSize: 1000 },           // sicurezza
  });

  // Somma robusta: ricalcola dal vivo quantity * unit_price (ignora total_price)
  const total = items.reduce((sum, it) => {
    const q  = Number(it.quantity || 0);
    const up = Number(it.unit_price || 0);
    return sum + q * up;
  }, 0);

  await strapi.entityService.update('api::order.order', orderId, {
    data: { total },
  });

  // --- DEBUG TEMP (rimuovi dopo) ---
  // console.log('[recomputeOrderTotal]', orderId, items.map(i => ({
  //   qty: Number(i.quantity), up: Number(i.unit_price), row: Number(i.total_price)
  // })), '=> total:', total);
};





/** Ricava l'orderId in modo robusto (senza toccare direttamente la colonna SQL) */
const resolveOrderId = async (event) => {
  // 1) prova da result già popolato
  let orderId = event.result?.order?.id || event.result?.order;

  // 2) prova dai dati passati (create/update)
  if (!orderId) {
    const maybe = event.params?.data?.order;
    if (typeof maybe === 'object' && maybe) orderId = maybe.id;
    else if (maybe) orderId = maybe;
  }

  // 3) carica la riga e popola l'ordine
  if (!orderId) {
    const itemId = event.params?.where?.id || event.result?.id;
    if (itemId) {
      const row = await strapi.db.query('api::order-item.order-item').findOne({
        where: { id: itemId },
        populate: { order: { select: ['id'] } }, // <-- niente select 'order', usiamo populate
      });
      orderId = row?.order?.id;
    }
  }

  return orderId || null;
};

module.exports = {
  async beforeCreate(event) {
    const data = event.params.data || {};
    const qty  = Number(data.quantity || 0);
    const unit = Number(data.unit_price || 0);

    if (data.total_price == null) {
      data.total_price = qty * unit;
    }
    if (data.size !== undefined && data.size !== null) {
      data.size = String(data.size);
    }
  },

  async afterCreate(event) {
    const orderId = await resolveOrderId(event);
    await recomputeOrderTotal(orderId);
  },

  async beforeUpdate(event) {
    const where = event.params.where || {};
    const data  = event.params.data  || {};

    const current = await strapi.db.query('api::order-item.order-item').findOne({
      where,
      select: ['quantity', 'unit_price', 'total_price', 'size'],
    });

    const nextQty = data.quantity != null ? Number(data.quantity) : Number(current?.quantity || 0);
    const unit    = data.unit_price != null ? Number(data.unit_price) : Number(current?.unit_price || 0);

    data.total_price = nextQty * unit;

    if (data.size !== undefined && data.size !== null) {
      data.size = String(data.size);
    }
  },

  async afterUpdate(event) {
    const orderId = await resolveOrderId(event);
    await recomputeOrderTotal(orderId);
  },

  async afterDelete(event) {
    // può essere singolo oggetto o array
    const results = Array.isArray(event.result) ? event.result : [event.result];

    // raccogli tutti gli orderId interessati
    const orderIds = [];

    for (const r of results) {
      let oid = r?.order?.id || r?.order;

      if (!oid && r?.id) {
        const row = await strapi.db.query('api::order-item.order-item').findOne({
          where: { id: r.id },
          populate: { order: { select: ['id'] } },
        });
        oid = row?.order?.id;
      }

      if (oid && !orderIds.includes(oid)) orderIds.push(oid);
    }

    await Promise.all(orderIds.map((oid) => recomputeOrderTotal(oid)));
  },
};
