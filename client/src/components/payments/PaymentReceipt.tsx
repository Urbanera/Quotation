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
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    width: '70%',
  },
  headerRight: {
    width: '30%',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 20,
    marginTop: 10,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  customerSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  receiptDetailSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  receiptDetailBox: {
    width: '40%',
    borderWidth: 0,
    padding: 10,
  },
  receiptDetail: {
    fontSize: 10,
    marginBottom: 4,
  },
  customerBox: {
    width: '50%',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerDetail: {
    fontSize: 10,
    marginBottom: 3,
  },
  amountSection: {
    marginBottom: 15,
  },
  amountWords: {
    fontSize: 10,
    marginBottom: 8,
  },
  paymentDetail: {
    fontSize: 10,
    marginBottom: 4,
  },
  amount: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 30,
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 10,
    marginBottom: 40,
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  forCompany: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 30,
  },
  signature: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
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

// Convert number to words for Indian currency
const convertToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numToWords(num % 100) : '');
    if (num < 100000) return numToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numToWords(num % 1000) : '');
    if (num < 10000000) return numToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numToWords(num % 100000) : '');
    return numToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numToWords(num % 10000000) : '');
  };

  // Handle decimal part
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = numToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  return result + ' only';
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
    check: 'Cheque',
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

  if (!companySettings || !customer) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Loading receipt data...</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Company Information and Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{companySettings.name || 'URBAN ERA INTERIOR STUDIO'}</Text>
            <Text style={styles.companyDetail}>{companySettings.address || 'Layout, No.plot Plaza, 48-11-13/2/1, Santhoshimatha Building, Visakhapatnam'}</Text>
            <Text style={styles.companyDetail}>Mobile: {companySettings.phone || '+91 98765 43210'}</Text>
            <Text style={styles.companyDetail}>Email: {companySettings.email || 'sales.visakhapatnam@leccocucina.com'}</Text>
            <Text style={styles.companyDetail}>GSTIN: {companySettings.taxId || '37AAVPG9038J2Z4'}</Text>
            <Text style={styles.companyDetail}>State: 37-Andhra Pradesh</Text>
          </View>
          <View style={styles.headerRight}>
            {companySettings.logo ? (
              <Image style={styles.logo} src={companySettings.logo} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>LECCO CUCINA</Text>
            )}
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Receipt Title */}
        <Text style={styles.receiptTitle}>RECEIPT</Text>
        
        {/* Receipt Information - Customer and Receipt Details Side by Side */}
        <View style={styles.customerSection}>
          <View style={styles.customerBox}>
            <Text style={styles.subTitle}>Received From:</Text>
            <Text style={styles.customerDetail}>{customer.name.toUpperCase()}</Text>
            <Text style={styles.customerDetail}>{customer.address}</Text>
            {customer.email && <Text style={styles.customerDetail}>Email: {customer.email}</Text>}
            {customer.phone && <Text style={styles.customerDetail}>Phone: {customer.phone}</Text>}
          </View>
          
          <View style={styles.receiptDetailBox}>
            <Text style={styles.subTitle}>Receipt Details:</Text>
            <Text style={styles.receiptDetail}>Receipt Number: {payment.receiptNumber}</Text>
            <Text style={styles.receiptDetail}>Date: {format(new Date(payment.paymentDate), 'dd-MM-yyyy')}</Text>
            <Text style={styles.receiptDetail}>Mode: {paymentMethods[payment.paymentMethod]}</Text>
          </View>
        </View>
        
        {/* Amount in Words */}
        <View style={styles.amountSection}>
          <Text style={styles.amountWords}>Amount in Words: {convertToWords(payment.amount)}</Text>
        </View>
        
        {/* Payment Details */}
        <View>
          <Text style={styles.paymentDetail}>Payment Mode: {paymentMethods[payment.paymentMethod]}</Text>
          {payment.transactionId && <Text style={styles.paymentDetail}>Transaction ID: {payment.transactionId}</Text>}
        </View>
        
        {/* Amount */}
        <View style={styles.amount}>
          <Text style={styles.amountText}>₹ {payment.amount.toFixed(2)}</Text>
        </View>
        
        {/* Description */}
        <View>
          <Text style={styles.description}>
            {payment.description || appSettings?.receiptTermsAndConditions || 
            "This receipt confirms the advance payment received by Lecco Cucina for starting work on your project. This advance is non-refundable and will be deducted from the total project cost upon completion. By signing, the client agrees to these terms, enabling the project with Lecco Cucina."}
          </Text>
        </View>
        
        {/* For Company and Signature */}
        <View>
          <Text style={styles.forCompany}>For: {companySettings.name}</Text>
          <View style={styles.signatureSection}>
            <Text style={styles.signature}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceipt;