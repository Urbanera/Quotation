import React from 'react';
import { format } from 'date-fns';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CustomerPayment, Customer, CompanySettings, AppSettings } from '@shared/schema';

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
    padding: 20, // Reduced padding
    fontFamily: 'Inter',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced margin
  },
  companyInfoSection: {
    width: '65%', // Reduced width to give more space for logo
  },
  logoSection: {
    width: '35%',
    alignItems: 'center', // Center the logo as per the reference image
    justifyContent: 'flex-start',
  },
  companyName: {
    fontSize: 12, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 2, // Reduced margin
  },
  companyDetail: {
    fontSize: 8, // Reduced font size
    marginBottom: 1,
    fontWeight: 'normal',
  },
  logo: {
    width: 130, // Increased width for better visibility
    height: 45, // Adjusted height
    objectFit: 'contain',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5, // Further reduced margin
  },
  receiptTitle: {
    fontSize: 10, // Further reduced font size
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8, // Further reduced margin
  },
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced margin
  },
  leftColumn: {
    width: '60%',
  },
  rightColumn: {
    width: '35%',
  },
  sectionTitle: {
    fontSize: 9, // Reduced font size
    fontWeight: 'bold',
    marginBottom: 3, // Reduced margin
  },
  detailText: {
    fontSize: 8, // Reduced font size
    marginBottom: 1, // Reduced margin
    lineHeight: 1.3, // Reduced line height
  },
  amountWordsSection: {
    marginBottom: 8, // Reduced margin
  },
  amountWords: {
    fontSize: 8, // Reduced font size
    fontWeight: 'bold',
  },
  paymentDetailSection: {
    marginBottom: 8, // Reduced margin
  },
  paymentDetail: {
    fontSize: 8, // Reduced font size
    marginBottom: 1, // Reduced margin
  },
  amountDisplaySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8, // Reduced margin
  },
  amountDisplay: {
    fontSize: 10, // Reduced font size
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: 15, // Reduced margin
  },
  description: {
    fontSize: 8, // Reduced font size
    lineHeight: 1.3, // Reduced line height
  },
  footerSection: {
    marginTop: 10, // Reduced margin
  },
  companyFor: {
    fontSize: 8, // Reduced font size
    textAlign: 'right',
    marginBottom: 20, // Reduced margin
  },
  signatureText: {
    fontSize: 8, // Reduced font size
    fontWeight: 'bold',
    textAlign: 'right',
  }
});

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

// Format payment method for display
const paymentMethods: Record<string, string> = {
  cash: 'CASH',
  bank_transfer: 'BANK TRANSFER',
  check: 'CHEQUE',
  card: 'CARD',
  upi: 'UPI',
  other: 'OTHER',
};

interface StaticReceiptProps {
  payment: CustomerPayment;
  customer: Customer;
  companySettings: CompanySettings;
  appSettings?: AppSettings;
}

// Create a pure component version for PDF generation (no hooks)
const StaticReceipt: React.FC<StaticReceiptProps> = ({ 
  payment, 
  customer, 
  companySettings,
  appSettings 
}) => {
  // Company info from settings
  const companyInfo = {
    name: companySettings.name || "URBAN ERA INTERIOR STUDIO",
    address: companySettings.address || "Layout, No.plot Plaza, 48-11-13/2/1, Santhoshimatha Building, Visakhapatnam",
    mobile: companySettings.phone || "+91 98765 43210",
    email: companySettings.email || "sales.visakhapatnam@leccocucina.com",
    gstin: companySettings.taxId || "37AAVPG9038J2Z4",
    state: "37-Andhra Pradesh",
    logo: companySettings.logo || null
  };

  // Terms text from payment description or settings
  const termsText = payment.description || 
                   appSettings?.receiptTermsAndConditions || 
                   "This receipt confirms the advance payment received for starting work on your project. This advance is non-refundable and will be deducted from the total project cost upon completion. By signing, the client agrees to these terms.";

  return (
    <Document>
      <Page size="A4" style={{...styles.page, height: '120%', width: '120%'}}>
        {/* Company Header */}
        <View style={styles.headerSection}>
          <View style={styles.companyInfoSection}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text style={styles.companyDetail}>{companyInfo.address}</Text>
            <Text style={styles.companyDetail}>Email: {companyInfo.email}</Text>
            <Text style={styles.companyDetail}>GSTIN: {companyInfo.gstin}</Text>
            <Text style={styles.companyDetail}>State: {companyInfo.state}</Text>
          </View>
          <View style={styles.logoSection}>
            {companyInfo.logo ? (
              <Image style={styles.logo} src={companyInfo.logo} />
            ) : (
              <View style={{border: '1px solid #ccc', padding: 5, backgroundColor: '#fff'}}>
                <Text style={{fontSize: 12, fontWeight: 'bold', color: '#777'}}>
                  LECCO
                </Text>
                <Text style={{fontSize: 12, fontWeight: 'bold', color: '#777'}}>
                  CUCINA
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Receipt Title */}
        <Text style={styles.receiptTitle}>RECEIPT</Text>

        {/* Two Column Layout for Customer and Receipt Details */}
        <View style={styles.twoColumnSection}>
          <View style={styles.leftColumn}>
            <Text style={styles.sectionTitle}>Received From:</Text>
            <Text style={styles.detailText}>{customer.name.toUpperCase()}</Text>
            <Text style={styles.detailText}>{customer.address ? (customer.address.length > 50 ? customer.address.substring(0, 50) + '...' : customer.address) : ''}</Text>
            <Text style={styles.detailText}>State: {companyInfo.state}</Text>
          </View>
          <View style={styles.rightColumn}>
            <Text style={styles.sectionTitle}>Receipt Details:</Text>
            <Text style={styles.detailText}>Receipt Number: {payment.receiptNumber}</Text>
            <Text style={styles.detailText}>Date: {format(new Date(payment.paymentDate), 'dd-MM-yyyy')}</Text>
            <Text style={styles.detailText}>Mode: {paymentMethods[payment.paymentMethod]}</Text>
          </View>
        </View>

        {/* Amount and Payment Details in a single row */}
        <View style={[styles.twoColumnSection, { marginBottom: 5 }]}>
          <View style={styles.leftColumn}>
            <Text style={styles.amountWords}>Received amount of ₹ {payment.amount.toFixed(2)} from {customer.name} as {payment.description || 'payment'}</Text>
            <Text style={styles.amountWords}>Amount in Words: {convertToWords(payment.amount)}</Text>
          </View>
          <View style={styles.rightColumn}>
            <Text style={styles.amountDisplay}>₹ {payment.amount.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Payment Method Details - more compact */}
        <View style={styles.paymentDetailSection}>
          <Text style={styles.paymentDetail}>Payment Mode: {paymentMethods[payment.paymentMethod]} {payment.transactionId ? `(${payment.transactionId})` : ''}</Text>
        </View>

        {/* Description/Terms - wrap to fit on one page */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            {termsText && termsText.length > 250 ? termsText.substring(0, 250) + '...' : termsText}
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.footerSection}>
          <Text style={styles.companyFor}>For: {companyInfo.name}</Text>
          <Text style={styles.signatureText}>Authorized Signatory</Text>
        </View>
      </Page>
    </Document>
  );
};

export { StaticReceipt };

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

interface PaymentReceiptProps {
  payment: CustomerPayment;
  customer?: Customer | null;
}

// The main component that will be used for preview
const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment, customer }) => {
  const [companySettings, setCompanySettings] = React.useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = React.useState<AppSettings | null>(null);
  
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
  
  if (!customer || !companySettings) {
    return (
      <Document>
        <Page size="A4" style={{...styles.page, height: '120%', width: '120%'}}>
          <Text>Loading receipt data...</Text>
        </Page>
      </Document>
    );
  }

  return (
    <StaticReceipt 
      payment={payment} 
      customer={customer} 
      companySettings={companySettings} 
      appSettings={appSettings || undefined}
    />
  );
};

export default PaymentReceipt;