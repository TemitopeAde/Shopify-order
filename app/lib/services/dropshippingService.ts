import axios, { AxiosError } from 'axios';
import qs from 'qs';
import { XMLParser } from 'fast-xml-parser';
import type { ShopifyOrderData, DropshipOrderResponse, GetOrdersResponse, DropshipOrder } from '../types/dropshipping';
import { OrderMapper } from './orderMapper';

/**
 * Service for integrating with Quintessence Jewelry Dropshipping API
 */
export class DropshippingService {
  private apiUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.apiUrl = process.env.DROPSHIP_API_URL || 'https://www.quintessencejewelry.com/qjcapis/makebulkOrders.xml';
    this.username = process.env.DROPSHIP_API_USERNAME || '';
    this.password = process.env.DROPSHIP_API_PASSWORD || '';

    if (!this.username || !this.password) {
      console.warn('Dropshipping API credentials not configured. Please set DROPSHIP_API_USERNAME and DROPSHIP_API_PASSWORD environment variables.');
    }
  }

  /**
   * Submits an order to the dropshipping API
   */
  async submitOrder(orderData: ShopifyOrderData): Promise<DropshipOrderResponse> {
    try {
      // Validate required data
      if (!orderData.shipping_address) {
        throw new Error('Shipping address is required');
      }

      if (!orderData.billing_address) {
        throw new Error('Billing address is required');
      }

      if (!orderData.line_items || orderData.line_items.length === 0) {
        throw new Error('Order must have at least one line item');
      }

      // Map Shopify order to API format
      const productBucket = OrderMapper.mapProductBucket(orderData.line_items);
      const shippingAddress = OrderMapper.mapShippingAddress(orderData.shipping_address);
      const billingAddress = OrderMapper.mapBillingAddress(orderData.billing_address);
      const customerEmail = OrderMapper.getCustomerEmail(orderData);
      const customerPO = OrderMapper.getCustomerPO(orderData);
      const logistic = OrderMapper.getLogisticMethod(orderData);

      // Build the request data
      const requestData: Record<string, string | number> = {
        uname: this.username,
        pass: this.password,
        email: customerEmail,
        customer_po: customerPO,
        Logistic: logistic,
        ...shippingAddress,
        ...billingAddress,
      };

      // Add product bucket to request data
      Object.entries(productBucket).forEach(([index, product]) => {
        requestData[`productBucket[${index}][sku]`] = product.sku;
        requestData[`productBucket[${index}][size]`] = product.size;
        requestData[`productBucket[${index}][qty]`] = product.qty;
      });

      // Log the request for debugging (remove sensitive data in production)
      console.log('Submitting order to dropshipping API:', {
        customer_po: customerPO,
        items: Object.keys(productBucket).length,
      });

      // Make the API request
      const response = await axios({
        method: 'post',
        url: this.apiUrl,
        headers: {
          'Accept': 'application/xml',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(requestData),
        timeout: 30000, // 30 second timeout
      });

      // Parse the response
      console.log('Dropshipping API response status:', response.status);

      return {
        success: response.status === 200,
        message: 'Order submitted successfully',
        orderId: customerPO,
      };

    } catch (error) {
      console.error('Error submitting order to dropshipping API:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          success: false,
          error: axiosError.message,
          message: `API request failed: ${axiosError.response?.status || 'Network error'}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to submit order to dropshipping API',
      };
    }
  }

  /**
   * Get orders from the dropshipping API
   */
  async getOrders(): Promise<GetOrdersResponse> {
    try {
      const requestData = qs.stringify({
        uname: this.username,
        pass: this.password,
      });

      console.log('Fetching orders from dropshipping API...');

      const response = await axios({
        method: 'post',
        url: 'https://www.quintessencejewelry.com/qjcapis/getOrders.xml',
        headers: {
          'Accept': 'application/xml',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: requestData,
        timeout: 30000,
        responseType: 'text', // Force text response to properly handle XML
      });

      console.log('Orders API response status:', response.status);
      console.log('Orders API response data type:', typeof response.data);
      console.log('Orders API response data (first 500 chars):',
        typeof response.data === 'string' ? response.data.substring(0, 500) : JSON.stringify(response.data).substring(0, 500)
      );

      // Parse XML response to extract orders
      const orders = this.parseOrdersFromXML(response.data);

      return {
        success: true,
        orders,
        message: 'Orders fetched successfully',
      };

    } catch (error) {
      console.error('Error fetching orders from dropshipping API:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          success: false,
          error: axiosError.message,
          message: `API request failed: ${axiosError.response?.status || 'Network error'}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch orders from dropshipping API',
      };
    }
  }

  /**
   * Parse orders from XML response
   */
  private parseOrdersFromXML(xmlData: any): DropshipOrder[] {
    try {
      // If data is not a string, log and return empty
      if (typeof xmlData !== 'string') {
        console.error('Expected XML string but got:', typeof xmlData);
        return [];
      }

      // Configure XML parser
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        parseAttributeValue: true,
      });

      // Parse XML
      const parsed = parser.parse(xmlData);
      console.log('Parsed XML structure:', JSON.stringify(parsed, null, 2).substring(0, 1000));

      // Extract orders from the response
      if (!parsed.response) {
        console.error('No response element in XML');
        return [];
      }

      // Get orders array (handle both single order and multiple orders)
      let ordersArray = parsed.response.order;
      if (!ordersArray) {
        console.log('No orders found in response');
        return [];
      }

      // Ensure ordersArray is an array (single order might not be in an array)
      if (!Array.isArray(ordersArray)) {
        ordersArray = [ordersArray];
      }

      console.log(`Found ${ordersArray.length} orders in XML`);

      // Format orders
      return this.formatOrders(ordersArray);
    } catch (error) {
      console.error('Error parsing orders XML:', error);
      return [];
    }
  }

  /**
   * Format orders from API response
   */
  private formatOrders(ordersArray: any[]): DropshipOrder[] {
    return ordersArray.map(order => {
      // Extract billing/shipping info
      const billingShipping = order.order_billing_shipping || {};

      // Build customer name from shipping info
      const firstName = billingShipping.s_first_name || '';
      const lastName = billingShipping.s_last_name || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'N/A';

      // Build shipping address string
      const shippingAddress = [
        billingShipping.s_company,
        firstName,
        lastName,
      ].filter(Boolean).join(', ') || 'N/A';

      return {
        orderId: order.order_number || 'N/A',
        orderDate: order.order_date || new Date().toISOString(),
        customerName,
        customerEmail: billingShipping.s_email || 'N/A',
        status: order.order_status?.toLowerCase() || 'pending',
        total: order.grand_total?.toString() || '0.00',
        items: [], // Products are in order_product.skubunch but structure not clear from XML
        shippingAddress,
        trackingNumber: order.awbn || undefined,
        // Additional fields from the XML
        shippedOn: order.shipped_on,
        shippedVia: order.shipped_via,
        paymentStatus: order.payment_status,
      };
    });
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testData = qs.stringify({
        uname: this.username,
        pass: this.password,
      });

      const response = await axios({
        method: 'post',
        url: this.apiUrl,
        headers: {
          'Accept': 'application/xml',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: testData,
        timeout: 10000,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Dropshipping API connection test failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const dropshippingService = new DropshippingService();
