import type { ShopifyOrderData, ProductItem, ShippingAddress, BillingAddress } from "../types/dropshipping";

/**
 * Maps Shopify order data to the dropshipping API format
 */
export class OrderMapper {
  /**
   * Converts Shopify line items to product bucket format
   */
  static mapProductBucket(lineItems: ShopifyOrderData['line_items']): Record<number, ProductItem> {
    const productBucket: Record<number, ProductItem> = {};

    lineItems.forEach((item, index) => {
      if (item.sku) {
        productBucket[index] = {
          sku: item.sku,
          size: item.variant_title || 'default',
          qty: item.quantity,
        };
      }
    });

    return productBucket;
  }

  /**
   * Maps Shopify shipping address to dropshipping API format
   */
  static mapShippingAddress(address: ShopifyOrderData['shipping_address']): ShippingAddress {
    if (!address) {
      throw new Error('Shipping address is required');
    }

    return {
      s_first_name: address.first_name || '',
      s_last_name: address.last_name || '',
      s_company: address.company || '',
      s_address_1: address.address1 || '',
      s_address_2: address.address2,
      s_city: address.city || '',
      s_state: address.province || '',
      s_country_name: address.country || '',
      s_zip_code: address.zip || '',
      s_contact_no: address.phone || '',
      s_email: address.first_name ? `${address.first_name.toLowerCase()}@customer.com` : '',
    };
  }

  /**
   * Maps Shopify billing address to dropshipping API format
   */
  static mapBillingAddress(address: ShopifyOrderData['billing_address']): BillingAddress {
    if (!address) {
      throw new Error('Billing address is required');
    }

    return {
      b_first_name: address.first_name || '',
      b_last_name: address.last_name || '',
      b_company: address.company || '',
      b_address_1: address.address1 || '',
      b_address_2: address.address2,
      b_city: address.city || '',
      b_state: address.province || '',
      b_country_name: address.country || '',
      b_zip_code: address.zip || '',
      b_contact_no: address.phone || '',
      b_email: address.first_name ? `${address.first_name.toLowerCase()}@customer.com` : '',
    };
  }

  /**
   * Determines the logistics/shipping method
   * Can be customized based on Shopify shipping method
   */
  static getLogisticMethod(orderData: ShopifyOrderData): string {
    // Default to FedEx Ground - can be customized based on shipping_lines in real order
    return 'FedEx Ground';
  }

  /**
   * Gets customer email from order
   */
  static getCustomerEmail(orderData: ShopifyOrderData): string {
    return orderData.email || orderData.customer?.email || '';
  }

  /**
   * Generates customer PO from order number
   */
  static getCustomerPO(orderData: ShopifyOrderData): string {
    return `PO-SHOPIFY-${orderData.order_number}`;
  }
}
