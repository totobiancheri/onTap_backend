module.exports = (policyContext, config, { strapi }) => {
  // policyContext è l'equivalente di ctx
  if (!policyContext.state.user) {
    return policyContext.unauthorized('Devi essere autenticato');
  }
  return true; // consente di procedere
};
