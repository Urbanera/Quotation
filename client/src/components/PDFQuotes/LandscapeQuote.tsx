import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { CompanySettings, QuotationWithDetails, AppSettings } from "@shared/schema";

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoSection: {
    width: '30%',
  },
  infoSection: {
    width: '65%',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerInfo: {
    marginTop: 30,
  },
  label: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    marginBottom: 8,
  },
  quotationNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  tableContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#009245',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    padding: 8,
    fontSize: 10,
  },
  tableRowEven: {
    backgroundColor: '#F9F9F9',
  },
  slNoCell: {
    width: '10%',
  },
  descriptionCell: {
    width: '40%',
  },
  quantityCell: {
    width: '10%',
    textAlign: 'center',
  },
  unitCell: {
    width: '15%',
    textAlign: 'right',
  },
  discountCell: {
    width: '10%',
    textAlign: 'center',
  },
  amountCell: {
    width: '15%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    padding: 5,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 12,
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#009245',
    color: 'white',
    padding: 5,
  },
  termsContainer: {
    marginTop: 30,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  termsText: {
    fontSize: 10,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

interface LandscapeQuoteProps {
  quotation: QuotationWithDetails;
  companySettings: CompanySettings;
  appSettings: AppSettings;
}

const LandscapeQuote: React.FC<LandscapeQuoteProps> = ({ 
  quotation, 
  companySettings,
  appSettings
}) => {
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Landscape Quotation</Text>
          
          <View style={styles.headerSection}>
            <View style={styles.infoSection}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
              <Text style={styles.text}>{companySettings?.address || "Address"}</Text>
              <Text style={styles.text}>Phone: {companySettings?.phone || "Phone"}</Text>
              <Text style={styles.text}>Email: {companySettings?.email || "Email"}</Text>
            </View>
          </View>
          
          <View style={styles.customerInfo}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{quotation?.customer?.name || "Customer Name"}</Text>
            
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{quotation?.customer?.address || "Address"}</Text>
            
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{quotation?.customer?.phone || "Phone"}</Text>
            
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{quotation?.customer?.email || "Email"}</Text>
            
            <Text style={styles.quotationNumber}>
              Quotation #: {quotation?.quotationNumber || "QT-0000"}
            </Text>
          </View>
          
          <View style={styles.termsContainer}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              1. This quotation is valid for 30 days from the date of issue.
            </Text>
            <Text style={styles.termsText}>
              2. Payment terms: 50% advance, 50% before delivery.
            </Text>
            <Text style={styles.termsText}>
              3. Delivery time: 4-6 weeks from the date of order confirmation.
            </Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>{companySettings?.name || "Company Name"} © {new Date().getFullYear()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default LandscapeQuote;