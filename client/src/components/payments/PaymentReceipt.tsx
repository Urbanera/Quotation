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
    padding: 30,
    fontFamily: 'Inter',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  companyInfoSection: {
    width: '75%',
  },
  logoSection: {
    width: '25%',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 9,
    marginBottom: 1,
    fontWeight: 'normal',
  },
  logo: {
    width: 70,
    height: 50,
    objectFit: 'contain',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  leftColumn: {
    width: '60%',
  },
  rightColumn: {
    width: '35%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 9,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  amountWordsSection: {
    marginBottom: 10,
  },
  amountWords: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  paymentDetailSection: {
    marginBottom: 10,
  },
  paymentDetail: {
    fontSize: 9,
    marginBottom: 2,
  },
  amountDisplaySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  amountDisplay: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: 40,
  },
  description: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  footerSection: {
    marginTop: 30,
  },
  companyFor: {
    fontSize: 9,
    textAlign: 'right',
    marginBottom: 30,
  },
  signatureText: {
    fontSize: 9,
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
      <Page size="A4" style={styles.page}>
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
              <Text style={{fontSize: 12, fontWeight: 'bold'}}>LECCO CUCINA</Text>
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
            <Text style={styles.detailText}>{customer.address.split(',')[0]}</Text>
            <Text style={styles.detailText}>{customer.address.split(',').slice(1).join(',')}</Text>
            <Text style={styles.detailText}>State: {companyInfo.state}</Text>
          </View>
          <View style={styles.rightColumn}>
            <Text style={styles.sectionTitle}>Receipt Details:</Text>
            <Text style={styles.detailText}>Receipt Number: {payment.receiptNumber}</Text>
            <Text style={styles.detailText}>Date: {format(new Date(payment.paymentDate), 'dd-MM-yyyy')}</Text>
            <Text style={styles.detailText}>Mode: {paymentMethods[payment.paymentMethod]}</Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountWordsSection}>
          <Text style={styles.amountWords}>Amount in Words: {convertToWords(payment.amount)}</Text>
        </View>

        {/* Payment Method Details */}
        <View style={styles.paymentDetailSection}>
          <Text style={styles.paymentDetail}>Payment Mode: {paymentMethods[payment.paymentMethod]} {payment.transactionId ? `(${payment.transactionId})` : ''}</Text>
        </View>

        {/* Amount Display */}
        <View style={styles.amountDisplaySection}>
          <Text style={styles.amountDisplay}>₹ {payment.amount.toFixed(2)}</Text>
        </View>

        {/* Description/Terms */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>{termsText}</Text>
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
        <Page size="A4" style={styles.page}>
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
      appSettings={appSettings}
    />
  );
};

export default PaymentReceipt;