/**
 * SafeX Fintech - MongoDB / Mongoose Schemas for Subscription & Billing Portal
 * Student: Ahmed Iqbal
 * Role: Member 6 - Database Architecture & Data Modeling (MongoDB / PostgreSQL)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ============================================================================
// 1. ORGANIZATION / CUSTOMER SCHEMA
// ============================================================================
const OrganizationSchema = new Schema({
    name: { type: String, required: true, trim: true },
    legalBusinessName: { type: String, trim: true },
    billingEmail: { type: String, required: true, unique: true, lowercase: true, index: true },
    taxId: { type: String, trim: true },
    currency: { type: String, default: 'USD', uppercase: true },
    countryCode: { type: String, default: 'US', uppercase: true },
    billingAddress: {
        line1: String,
        city: String,
        postalCode: String,
        country: String
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================================================
// 2. PRICING PLAN SCHEMA
// ============================================================================
const PricingPlanSchema = new Schema({
    planCode: { type: String, required: true, unique: true, uppercase: true }, // e.g. 'PRO_MO'
    name: { type: String, required: true },
    description: String,
    billingInterval: { 
        type: String, 
        enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'], 
        default: 'MONTHLY' 
    },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    trialPeriodDays: { type: Number, default: 0 },
    maxTeamSeats: { type: Number, default: 1 },
    monthlyApiCreditLimit: { type: Number, default: 10000 },
    isPublic: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================================================
// 3. PAYMENT METHOD SCHEMA (Tokenized PCI-Compliant Cards)
// ============================================================================
const PaymentMethodSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    methodType: { 
        type: String, 
        enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER_ACH', 'DIGITAL_WALLET'], 
        default: 'CREDIT_CARD' 
    },
    gatewayCustomerId: String,
    gatewayPaymentMethodId: String,
    cardBrand: String,
    cardLast4: { type: String, minlength: 4, maxlength: 4 },
    cardExpMonth: { type: Number, min: 1, max: 12 },
    cardExpYear: { type: Number, min: 2024 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ============================================================================
// 4. SUBSCRIPTION SCHEMA
// ============================================================================
const SubscriptionSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'PricingPlan', required: true },
    defaultPaymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    status: { 
        type: String, 
        enum: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED'], 
        default: 'TRIALING',
        index: true
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true, index: true },
    trialStart: Date,
    trialEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: Date,
    cancellationReason: String,
    seatQuantity: { type: Number, default: 1, min: 1 }
}, { timestamps: true });

// ============================================================================
// 5. INVOICE SCHEMA
// ============================================================================
const InvoiceLineItemSchema = new Schema({
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    proration: { type: Boolean, default: false }
});

const InvoiceSchema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true }, // e.g. 'INV-2026-000101'
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    status: { 
        type: String, 
        enum: ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'], 
        default: 'DRAFT',
        index: true
    },
    currency: { type: String, default: 'USD' },
    lineItems: [InvoiceLineItemSchema],
    subtotalAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountRemaining: { type: Number, default: 0, min: 0 },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: Date,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    pdfUrl: String
}, { timestamps: true });

// ============================================================================
// 6. TRANSACTION SCHEMA (Payment Ledger)
// ============================================================================
const TransactionSchema = new Schema({
    transactionReference: { type: String, required: true, unique: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    paymentMethodId: { type: Schema.Types.ObjectId, ref: 'PaymentMethod' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: { 
        type: String, 
        enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'], 
        default: 'PENDING',
        index: true 
    },
    gatewayResponseCode: String,
    gatewayErrorMessage: String,
    settledAt: Date
}, { timestamps: true });

// ============================================================================
// 7. USAGE RECORD SCHEMA (High Volume Metered Billing)
// ============================================================================
const UsageRecordSchema = new Schema({
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    metricType: { 
        type: String, 
        enum: ['API_REQUESTS', 'SEATS_ACTIVE', 'TRANSACTION_VOLUME_USD', 'STORAGE_GB'], 
        required: true 
    },
    quantityUsed: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for aggregation performance
UsageRecordSchema.index({ subscriptionId: 1, metricType: 1, recordedAt: -1 });

// ============================================================================
// 8. AUDIT LOG SCHEMA
// ============================================================================
const AuditLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    actionType: { type: String, required: true, index: true },
    actorEmail: { type: String, required: true },
    ipAddress: String,
    payload: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    Organization: mongoose.model('Organization', OrganizationSchema),
    PricingPlan: mongoose.model('PricingPlan', PricingPlanSchema),
    PaymentMethod: mongoose.model('PaymentMethod', PaymentMethodSchema),
    Subscription: mongoose.model('Subscription', SubscriptionSchema),
    Invoice: mongoose.model('Invoice', InvoiceSchema),
    Transaction: mongoose.model('Transaction', TransactionSchema),
    UsageRecord: mongoose.model('UsageRecord', UsageRecordSchema),
    AuditLog: mongoose.model('AuditLog', AuditLogSchema)
};
