module.exports = {
  routes: [
    { method: 'POST',   path: '/orders/:id/payments', handler: 'payment.createForOrder' },
    { method: 'GET',    path: '/orders/:id/payments', handler: 'payment.findForOrder' },
    { method: 'DELETE', path: '/payments/:id',        handler: 'payment.void' }
  ]
};
