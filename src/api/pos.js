import api from "./index";

// Prodotti a prezzo fisso (price != null)
export const fetchFixedPriceProducts = async (breweryId) => {
  const res = await api.get(
    `/products?filters[brewery][id][$eq]=${breweryId}&filters[price][$notNull]=true&pagination[pageSize]=100`
  );
  return res.data.data;
};

// Spine attive
export const fetchActiveTaps = async (breweryId) => {
  const res = await api.get(
    `/connected-kegs?filters[brewery][id][$eq]=${breweryId}&filters[is_active][$eq]=true&populate=product&pagination[pageSize]=100`
  );
  return res.data.data;
};

// Ordini aperti
export const fetchOpenOrders = async (breweryId) => {
  const res = await api.get(
    `/orders?filters[brewery][id][$eq]=${breweryId}&filters[status][$eq]=aperta&populate[order_items][populate][0]=product&populate[order_items][populate][1]=connected_keg&pagination[pageSize]=100`
  );
  return res.data.data;
};

export const openOrder = async (breweryId) => {
  const res = await api.post(`/orders/open`, { breweryId });
  return res.data;
};

export const addItemToOrder = async ({ orderId, productId, quantity, unit_price, connectedKegId, size }) => {
  const res = await api.post(`/orders/add-item`, {
    orderId,
    productId,
    quantity,
    unit_price,
    connectedKegId: connectedKegId || null,
    size: size || null,
  });
  return res.data;
};

export const closeOrder = async (orderId) => {
  const res = await api.post(`/orders/${orderId}/close`);
  return res.data;
};
