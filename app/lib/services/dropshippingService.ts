import axios, { AxiosError } from 'axios';
import qs from 'qs';
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
      });

      console.log('Orders API response status:', response.status);

      // Parse XML response to extract orders
      // Note: The API returns XML, we'll parse it into our format
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
   * This is a simplified parser - you may need to adjust based on actual API response
   */
  private parseOrdersFromXML(xmlData: any): DropshipOrder[] {
    // For now, we'll return the raw data
    // You may need to implement proper XML parsing based on the actual API response format
    try {
      // If the response is already JSON (some APIs return JSON with XML header)
      if (typeof xmlData === 'object') {
        return this.formatOrders(xmlData);
      }

      // Return empty array if parsing fails
      return [];
    } catch (error) {
      console.error('Error parsing orders XML:', error);
      return [];
    }
  }

  /**
   * Format orders from API response
   */
  private formatOrders(data: any): DropshipOrder[] {
    // This is a placeholder formatter
    // Adjust based on actual API response structure
    if (Array.isArray(data)) {
      return data.map(order => ({
        orderId: order.id || order.order_id || 'N/A',
        orderDate: order.created_at || order.date || new Date().toISOString(),
        customerName: order.customer_name || 'N/A',
        customerEmail: order.customer_email || order.email || 'N/A',
        status: order.status || 'pending',
        total: order.total || order.total_price || '0.00',
        items: order.items || [],
        shippingAddress: order.shipping_address || 'N/A',
        trackingNumber: order.tracking_number,
      }));
    }

    return [];
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
