/**
 * Types for Quintessence Jewelry Dropshipping API
 */

export interface ProductItem {
  sku: string;
  size: string;
  qty: number;
}

export interface ShippingAddress {
  s_first_name: string;
  s_last_name: string;
  s_company?: string;
  s_address_1: string;
  s_address_2?: string;
  s_city: string;
  s_state: string;
  s_country_name: string;
  s_zip_code: string;
  s_contact_no: string;
  s_email: string;
}

export interface BillingAddress {
  b_first_name: string;
  b_last_name: string;
  b_company?: string;
  b_address_1: string;
  b_address_2?: string;
  b_city: string;
  b_state: string;
  b_country_name: string;
  b_zip_code: string;
  b_contact_no: string;
  b_email: string;
}

export interface DropshipOrderRequest {
  uname: string;
  pass: string;
  productBucket: Record<number, ProductItem>;
  email: string;
  customer_po: string;
  Logistic: string;
  shipping: ShippingAddress;
  billing: BillingAddress;
}

export interface DropshipOrderResponse {
  success: boolean;
  message?: string;
  orderId?: string;
  error?: string;
}

export interface ShopifyOrderData {
  id: number;
  order_number: number;
  email: string;
  line_items: Array<{
    sku?: string;
    variant_title?: string;
    quantity: number;
    name: string;
  }>;
  shipping_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  customer?: {
    email: string;
  };
}

export interface DropshipOrder {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  shippingAddress: string;
  trackingNumber?: string;
}

export interface GetOrdersResponse {
  success: boolean;
  orders?: DropshipOrder[];
  error?: string;
  message?: string;
}
