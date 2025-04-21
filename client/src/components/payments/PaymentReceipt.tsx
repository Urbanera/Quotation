import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { CustomerPayment, Customer } from "@shared/schema";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1px solid #ccc",
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain",
  },
  companyInfo: {
    marginTop: 10,
    fontSize: 10,
    textAlign: "right",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#4263eb",
    marginTop: 10,
  },
  receiptInfo: {
    marginBottom: 20,
    fontSize: 10,
  },
  receiptInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  customerInfo: {
    marginBottom: 20,
    fontSize: 10,
  },
  paymentInfo: {
    marginBottom: 20,
  },
  paymentTable: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderStyle: "solid",
  },
  tableHeaderRow: {
    backgroundColor: "#f8f9fa",
    fontWeight: "bold",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderRightWidth: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: "bold",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderRightWidth: 1,
    padding: 5,
    fontSize: 9,
  },
  tableCellCenter: {
    textAlign: "center",
  },
  tableCellRight: {
    textAlign: "right",
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: "center",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 10,
    color: "#4263eb",
  },
  signature: {
    marginTop: 50,
    fontSize: 10,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: 150,
    borderBottom: "1px solid #000",
    marginBottom: 5,
  },
  signatureLabel: {
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    top: 300,
    left: 100,
    right: 100,
    textAlign: "center",
    color: "#e9ecef",
    fontSize: 50,
    transform: "rotate(-45deg)",
    opacity: 0.3,
  },
  amountInWords: {
    marginTop: 15,
    fontSize: 10,
    marginBottom: 15,
    fontStyle: "italic",
  },
});

const PaymentReceipt = ({ payment, customer }: { payment: CustomerPayment; customer?: Customer }) => {
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash": return "Cash";
      case "bank_transfer": return "Bank Transfer";
      case "check": return "Check";
      case "card": return "Card";
      case "upi": return "UPI";
      case "other": return "Other";
      default: return method;
    }
  };

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case "token_advance": return "Token Advance";
      case "starting_production": return "Starting Production";
      case "final_payment": return "Final Payment";
      case "other": return "Other";
      default: return type;
    }
  };

  // Convert number to words for Indian currency
  const convertToWords = (num: number) => {
    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const numString = num.toString();
    const decimalPart = numString.indexOf(".") !== -1 ? numString.substring(numString.indexOf(".") + 1) : "0";
    const wholePart = Math.floor(num);
    
    if (wholePart === 0) return "Zero Rupees";
    
    let result = "";
    
    // Convert lakhs
    if (wholePart >= 100000) {
      result += single[Math.floor(wholePart / 100000)] + " Lakh ";
      num %= 100000;
    }
    
    // Convert thousands
    if (wholePart >= 1000) {
      result += single[Math.floor(wholePart / 1000)] + " Thousand ";
      num %= 1000;
    }
    
    // Convert hundreds
    if (wholePart >= 100) {
      result += single[Math.floor(wholePart / 100)] + " Hundred ";
      num %= 100;
    }
    
    // Convert tens and ones
    if (wholePart > 0) {
      if (wholePart < 20) {
        result += single[wholePart];
      } else {
        result += tens[Math.floor(wholePart / 10)];
        if (wholePart % 10 > 0) {
          result += " " + single[wholePart % 10];
        }
      }
    }
    
    result += " Rupees";
    
    // Add paise
    if (parseInt(decimalPart) > 0) {
      result += " and ";
      if (parseInt(decimalPart) < 20) {
        result += single[parseInt(decimalPart)];
      } else {
        result += tens[Math.floor(parseInt(decimalPart) / 10)];
        if (parseInt(decimalPart) % 10 > 0) {
          result += " " + single[parseInt(decimalPart) % 10];
        }
      }
      result += " Paise";
    }
    
    return result;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <View style={styles.watermark}>
          <Text>RECEIPT</Text>
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              {/* Logo placeholder */}
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#4263eb" }}>Interio Designs</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text>123 Design Street, Bangalore</Text>
              <Text>Karnataka, India - 560001</Text>
              <Text>Phone: +91 98765 43210</Text>
              <Text>Email: contact@interiodesigns.com</Text>
              <Text>GSTIN: 29AABCI1234A1Z5</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.title}>PAYMENT RECEIPT</Text>
        
        {/* Receipt Information */}
        <View style={styles.receiptInfo}>
          <View style={styles.receiptInfoRow}>
            <Text>Receipt Number:</Text>
            <Text>{payment.receiptNumber}</Text>
          </View>
          <View style={styles.receiptInfoRow}>
            <Text>Transaction ID:</Text>
            <Text>{payment.transactionId}</Text>
          </View>
          <View style={styles.receiptInfoRow}>
            <Text>Date:</Text>
            <Text>{format(new Date(payment.paymentDate), "PPP")}</Text>
          </View>
        </View>
        
        {/* Customer Information */}
        <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
        <View style={styles.customerInfo}>
          <Text>Name: {customer?.name || "N/A"}</Text>
          <Text>Phone: {customer?.phone || "N/A"}</Text>
          <Text>Email: {customer?.email || "N/A"}</Text>
          <Text>Address: {customer?.address || "N/A"}</Text>
        </View>
        
        {/* Payment Information */}
        <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentTable}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <View style={styles.tableColHeader}>
                <Text>Payment Type</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text>Payment Method</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text>Description</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text>Amount</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text>{getPaymentTypeText(payment.paymentType)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>{getPaymentMethodText(payment.paymentMethod)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text>{payment.description || "N/A"}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCellRight}>{formatCurrency(payment.amount)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Total Amount */}
        <View style={styles.totalAmount}>
          <Text>Total Amount: {formatCurrency(payment.amount)}</Text>
        </View>
        
        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text>Amount in words: {convertToWords(payment.amount)}</Text>
        </View>
        
        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureRow}>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Customer Signature</Text>
            </View>
            <View>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>For Interio Designs</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated receipt and does not require a physical signature.</Text>
          <Text style={{ marginTop: 5 }}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceipt;