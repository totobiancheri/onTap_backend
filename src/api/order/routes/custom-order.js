module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/open',
      handler: 'order.open',
      config: { policies: ['global::is-authenticated'] }
    },
    {
      method: 'POST',
      path: '/orders/add-item',
      handler: 'order.addItem',
      config: { policies: ['global::is-authenticated'] }
    },
    {
      method: 'POST',
      path: '/orders/:id/close',
      handler: 'order.close',
      config: { policies: ['global::is-authenticated'] }
    }
  ]
};
