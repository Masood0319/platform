import Stripe from 'stripe';
import {
  assertValidCents,
  formatCents,
  fromCents,
  toCents,
} from "#root/lib/payments/money.js";

let stripeClient = null;

function getStripe() {
  if (stripeClient) return stripeClient;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    typescript: false,
  });
  return stripeClient;
}

// Configuration constants
export const STRIPE_CONFIG = {
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CURRENCY: 'usd',
  SUCCESS_URL: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/payments?status=success',
  CANCEL_URL: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/payments?status=canceled',
  COUNTRY: 'US',
  MINIMUM_AMOUNT: 50, // $0.50 minimum
  MAXIMUM_AMOUNT: 100000000, // $1M maximum
};

// Main Stripe service class
export class StripeService {
  static getClient() {
    return getStripe();
  }

  // Create or retrieve a customer
  static async createOrRetrieveCustomer(user) {
    try {
      // Check if user already has a Stripe customer ID
      if (user.stripeCustomerId) {
        try {
          const customer = await getStripe().customers.retrieve(user.stripeCustomerId);
          if (!customer.deleted) {
            return customer;
          }
        } catch (error) {
          console.log('Existing customer not found, creating new one');
        }
      }

      // Create new customer
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: user._id.toString(),
          role: user.role,
          platform: 'startup-investor-platform'
        },
      });

      return customer;
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // Create a payment intent for peer-to-peer transfer
  static async createPaymentIntent({
    amountCents,
    currency = STRIPE_CONFIG.CURRENCY,
    senderId,
    receiverId,
    description = '',
    metadata = {}
  }) {
    try {
      // Validate amount
      assertValidCents(amountCents);

      // Create payment intent
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'automatic',
        confirmation_method: 'automatic',
        description: description || `Payment from user ${senderId} to user ${receiverId}`,
        metadata: {
          senderId: senderId.toString(),
          receiverId: receiverId.toString(),
          type: 'peer_to_peer',
          platform: 'startup-investor-platform',
          ...metadata
        },
        // Enable webhooks for this payment
        receipt_email: null, // Will be set after customer is attached
        setup_future_usage: 'off_session', // Allow future payments with same method
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Confirm a payment intent
  static async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await getStripe().paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: STRIPE_CONFIG.SUCCESS_URL,
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  // Retrieve payment intent
  static async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method', 'latest_charge']
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  // Cancel a payment intent
  static async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await getStripe().paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error canceling payment intent:', error);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  // Create a refund
  static async createRefund(chargeId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        charge: chargeId,
        reason
      };

      if (Number.isInteger(amount)) {
        if (amount <= 0) {
          throw new Error("Refund amount must be greater than 0 cents");
        }
        refundData.amount = amount;
      }

      const refund = await getStripe().refunds.create(refundData);
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  // Create a payment method
  static async createPaymentMethod(type, card, billingDetails = {}) {
    try {
      const paymentMethod = await getStripe().paymentMethods.create({
        type,
        card,
        billing_details: billingDetails
      });
      return paymentMethod;
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new Error(`Failed to create payment method: ${error.message}`);
    }
  }

  // Attach payment method to customer
  static async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
    try {
      const paymentMethod = await getStripe().paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return paymentMethod;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }

  // Get customer's payment methods
  static async getCustomerPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await getStripe().paymentMethods.list({
        customer: customerId,
        type,
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  // Detach payment method from customer
  static async detachPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await getStripe().paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error(`Failed to detach payment method: ${error.message}`);
    }
  }

  // Get charge details
  static async retrieveCharge(chargeId) {
    try {
      const charge = await getStripe().charges.retrieve(chargeId);
      return charge;
    } catch (error) {
      console.error('Error retrieving charge:', error);
      throw new Error(`Failed to retrieve charge: ${error.message}`);
    }
  }

  // Validate webhook signature
  static constructWebhookEvent(payload, signature) {
    try {
      return getStripe().webhooks.constructEvent(
        payload,
        signature,
        STRIPE_CONFIG.WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  // Format amount for display
  static formatAmount(amount, currency = 'USD') {
    return formatCents(amount, currency);
  }

  // Convert cents to dollars
  static centsToDollars(cents) {
    return fromCents(cents);
  }

  // Convert dollars to cents
  static dollarsToCents(dollars) {
    return toCents(dollars);
  }

  // Validate payment amount
  static validateAmount(amount) {
    const amountCents = this.dollarsToCents(amount);
    return assertValidCents(amountCents);
  }

  static validateAmountCents(amountCents) {
    return assertValidCents(amountCents);
  }

  // Calculate platform fee (if needed in the future)
  static calculatePlatformFee(amount, feePercentage = 0) {
    if (feePercentage <= 0) return 0;
    return Math.round(amount * (feePercentage / 100));
  }

  // Create setup intent for saving payment method
  static async createSetupIntent(customerId, paymentMethodTypes = ['card']) {
    try {
      const setupIntent = await getStripe().setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        usage: 'off_session',
      });
      return setupIntent;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error(`Failed to create setup intent: ${error.message}`);
    }
  }

  // Retrieve balance transactions
  static async getBalanceTransactions(limit = 10) {
    try {
      const transactions = await getStripe().balanceTransactions.list({
        limit,
      });
      return transactions.data;
    } catch (error) {
      console.error('Error retrieving balance transactions:', error);
      throw new Error(`Failed to retrieve balance transactions: ${error.message}`);
    }
  }

  // Search charges
  static async searchCharges(query, limit = 10) {
    try {
      const charges = await getStripe().charges.search({
        query,
        limit,
      });
      return charges.data;
    } catch (error) {
      console.error('Error searching charges:', error);
      throw new Error(`Failed to search charges: ${error.message}`);
    }
  }
}

export default getStripe;
