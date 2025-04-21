import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CustomerPayment, Customer, AppSettings } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  receiptDate: {
    fontSize: 12,
    color: '#374151',
  },
  receiptInfo: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'right',
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
    textTransform: 'uppercase',
  },
  customerInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    color: '#4b5563',
    width: 120,
  },
  value: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
  },
  amount: {
    marginTop: 30,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    backgroundColor: '#f9fafb',
  },
  tableCol: {
    width: '50%',
    padding: 8,
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

interface PaymentReceiptProps {
  payment: CustomerPayment;
  customer?: Customer | null;
}

// Helper function to fetch company settings
const fetchCompanySettings = async () => {
  try {
    const response = await fetch('/api/settings/company');
    if (!response.ok) throw new Error('Failed to fetch company settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// Helper function to fetch app settings
const fetchAppSettings = async () => {
  try {
    const response = await fetch('/api/settings/app');
    if (!response.ok) throw new Error('Failed to fetch app settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return null;
  }
};

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment, customer }) => {
  const [companySettings, setCompanySettings] = React.useState<any>(null);
  const [appSettings, setAppSettings] = React.useState<any>(null);
  
  // Fetch settings when component mounts
  React.useEffect(() => {
    const getSettings = async () => {
      const company = await fetchCompanySettings();
      const app = await fetchAppSettings();
      setCompanySettings(company);
      setAppSettings(app);
    };
    
    getSettings();
  }, []);
  
  // Format payment method for display
  const paymentMethods: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    card: 'Card',
    upi: 'UPI',
    other: 'Other',
  };

  // Format payment type for display
  const paymentTypes: Record<string, string> = {
    token_advance: 'Token Advance',
    starting_production: 'Starting Production',
    final_payment: 'Final Payment',
    other: 'Other',
  };

  // Set up company info at the top of the receipt
  const companyInfo = companySettings ? (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
      <View>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{companySettings.name}</Text>
        <Text style={{ fontSize: 10 }}>{companySettings.address}</Text>
        <Text style={{ fontSize: 10 }}>Phone: {companySettings.phone}</Text>
        <Text style={{ fontSize: 10 }}>Email: {companySettings.email}</Text>
        {companySettings.website && <Text style={{ fontSize: 10 }}>Website: {companySettings.website}</Text>}
        {companySettings.taxId && <Text style={{ fontSize: 10 }}>Tax ID: {companySettings.taxId}</Text>}
      </View>
      {companySettings.logo && (
        <Image
          src={companySettings.logo}
          style={{ width: 100, height: 50, objectFit: 'contain' }}
        />
      )}
    </View>
  ) : null;

  // Set up terms and conditions for the receipt using receipt-specific terms if available
  const termsAndConditions = appSettings?.receiptTermsAndConditions ? (
    <View style={{ marginTop: 15, padding: 10, borderTop: 1, borderTopColor: '#e5e7eb' }}>
      <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Terms & Conditions</Text>
      <Text style={{ fontSize: 8, color: '#4b5563' }}>{appSettings.receiptTermsAndConditions}</Text>
    </View>
  ) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {companyInfo}
        
        <View style={styles.header}>
          <View>
            <Text style={styles.receiptTitle}>RECEIPT</Text>
            <Text style={styles.receiptDate}>{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</Text>
          </View>
          <View>
            <Text style={styles.receiptInfo}>Receipt #{payment.receiptNumber}</Text>
            <Text style={styles.receiptInfo}>Transaction ID: {payment.transactionId}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            {customer ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{customer.name}</Text>
                </View>
                {customer.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{customer.email}</Text>
                  </View>
                )}
                {customer.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>{customer.phone}</Text>
                  </View>
                )}
                {customer.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>{customer.address}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Customer ID:</Text>
                <Text style={styles.value}>{payment.customerId}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableHeader}>Item</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableHeader}>Details</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Payment Method</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{paymentMethods[payment.paymentMethod] || payment.paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Payment Type</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{paymentTypes[payment.paymentType] || payment.paymentType}</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>Payment Date</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{format(new Date(payment.paymentDate), 'dd MMMM yyyy')}</Text>
              </View>
            </View>

            {payment.description && (
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>Description</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{payment.description}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.amount}>
          <Text>Amount Paid: {formatCurrency(payment.amount)}</Text>
        </View>
        
        {termsAndConditions}

        <View style={styles.footer}>
          <Text>This is a computer-generated receipt and does not require a signature.</Text>
          <Text>Generated on {format(new Date(), 'dd MMMM yyyy, h:mm a')}</Text>
          {companySettings && (
            <Text style={{ marginTop: 5, fontSize: 8 }}>
              {companySettings.name} • {companySettings.phone} • {companySettings.email}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceipt;