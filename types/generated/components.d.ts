import type { Schema, Attribute } from '@strapi/strapi';

export interface PaymentAllocation extends Schema.Component {
  collectionName: 'components_payment_allocations';
  info: {
    displayName: 'allocation';
    icon: 'bulletList';
  };
  attributes: {
    order_item: Attribute.Relation<
      'payment.allocation',
      'manyToOne',
      'api::order-item.order-item'
    > &
      Attribute.Required;
    units: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    amount_cents: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'payment.allocation': PaymentAllocation;
    }
  }
}
