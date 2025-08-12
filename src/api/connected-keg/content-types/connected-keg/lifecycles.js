'use strict';

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    // 1) copia default formats se non inviati
    if (!data.formats || !Array.isArray(data.formats) || data.formats.length === 0) {
      if (data.product) {
        const prod = await strapi.entityService.findOne('api::product.product', data.product, {
          fields: ['keg_capacity_liters', 'default_formats'],
        });
        if (Array.isArray(prod?.default_formats)) {
          data.formats = prod.default_formats.map(f => ({ size: Number(f.size), price: Number(f.price) }));
        }
        // 2) quantità: se non arrivano, usa la capacità dal prodotto
        const cap = Number(data.quantity_total ?? prod?.keg_capacity_liters ?? 0);
        data.quantity_total = cap > 0 ? cap : null;
        data.quantity_remaining = cap > 0 ? cap : null;
      }
    } else {
      // se formats arrivano dal client, comunque sistema le quantità se non presenti
      if ((data.quantity_total == null || data.quantity_remaining == null) && data.product) {
        const prod = await strapi.entityService.findOne('api::product.product', data.product, {
          fields: ['keg_capacity_liters'],
        });
        const cap = Number(data.quantity_total ?? prod?.keg_capacity_liters ?? 0);
        data.quantity_total = cap > 0 ? cap : null;
        data.quantity_remaining = cap > 0 ? cap : null;
      }
    }

    // 3) set date e flag attivo
    if (!data.date_attached) data.date_attached = new Date();
    if (data.is_active == null) data.is_active = true;

    // 4) regola: una sola birra attiva per spina (stessa brewery & tap)
    if (data.is_active && data.brewery && data.tap_number != null) {
      const existing = await strapi.entityService.findMany('api::connected-keg.connected-keg', {
        filters: {
          brewery: { id: data.brewery },
          tap_number: data.tap_number,
          is_active: true,
        },
        fields: ['id'],
        limit: 100,
      });

      for (const k of existing) {
        await strapi.entityService.update('api::connected-keg.connected-keg', k.id, {
          data: { is_active: false },
        });
      }
    }
  },
};
