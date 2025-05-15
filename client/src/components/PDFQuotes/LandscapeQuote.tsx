import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { CompanySettings, QuotationWithDetails, AppSettings } from "@shared/schema";
import { formatCurrency } from "@/lib/calculations";

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
  aboutSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#333333',
    textAlign: 'justify',
  },
  imageGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  roomImageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 10,
    marginTop: 20,
  },
  roomImage: {
    width: '31%',
    margin: '1%',
    height: 150,
    objectFit: 'cover',
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
      {/* First page - Cover with logo and customer info */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Landscape Quotation</Text>
          
          <View style={styles.headerSection}>
            <View style={styles.logoSection}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: '100%', maxHeight: 80 }} 
                />
              )}
            </View>
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
      
      {/* Second page - About the company */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerSection}>
            <View style={styles.logoSection}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: '100%', maxHeight: 60 }} 
                />
              )}
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
            </View>
          </View>
          
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About {companySettings?.name || "Our Company"}</Text>
            
            {appSettings?.presentationSecondPageContent ? (
              <Text style={styles.aboutText}>
                {appSettings.presentationSecondPageContent.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            ) : (
              <Text style={styles.aboutText}>
                {companySettings?.name} is a premier interior design firm specializing in creating exceptional living 
                and working spaces that reflect our clients' unique styles and needs. With a dedicated team 
                of designers and craftsmen, we combine innovative design with functionality to transform your 
                space into a beautiful, practical environment.
                
                Our process begins with understanding your vision, lifestyle, and requirements before crafting 
                customized solutions that blend aesthetics with practicality. We work with high-quality materials 
                and trusted suppliers to ensure durability and elegance in every project.
                
                From concept to completion, we manage every aspect of your project with attention to detail, 
                transparent communication, and commitment to excellence.
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>{companySettings?.name || "Company Name"} © {new Date().getFullYear()}</Text>
        </View>
      </Page>
      
      {/* Room image pages - one page per room */}
      {quotation.rooms.map((room, roomIndex) => (
        <Page key={roomIndex} size="A4" style={styles.page}>
          <View style={styles.section}>
            <View style={styles.headerSection}>
              <View style={styles.logoSection}>
                {companySettings?.logo && (
                  <Image 
                    src={companySettings.logo} 
                    style={{ width: '100%', maxHeight: 50 }} 
                  />
                )}
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
              </View>
            </View>
            
            <Text style={styles.roomImageTitle}>{room.name}</Text>
            
            {room.description && (
              <Text style={styles.aboutText}>{room.description}</Text>
            )}
            
            <View style={styles.imageGrid}>
              {room.images && room.images.length > 0 ? (
                room.images.map((image, imageIndex) => (
                  <Image 
                    key={imageIndex}
                    src={image.path}
                    style={styles.roomImage}
                  />
                ))
              ) : (
                <Text style={{ color: '#666666', fontStyle: 'italic', marginTop: 10 }}>No images available</Text>
              )}
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text>{companySettings?.name || "Company Name"} - Room {roomIndex + 1}: {room.name}</Text>
          </View>
        </Page>
      ))}
      
      {/* Price table page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerSection}>
            <View style={styles.logoSection}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: '100%', maxHeight: 50 }} 
                />
              )}
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
            </View>
          </View>
          
          <Text style={styles.aboutTitle}>Quotation Summary</Text>
          
          {quotation.rooms.map((room, roomIndex) => (
            <View key={roomIndex} style={{ marginBottom: 20 }}>
              <Text style={styles.roomImageTitle}>{room.name}</Text>
              
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.slNoCell]}>No.</Text>
                  <Text style={[styles.descriptionCell]}>Description</Text>
                  <Text style={[styles.quantityCell]}>Qty</Text>
                  <Text style={[styles.unitCell]}>Unit Price</Text>
                  <Text style={[styles.discountCell]}>Disc%</Text>
                  <Text style={[styles.amountCell]}>Amount</Text>
                </View>
                
                {room.products.map((product, index) => {
                  const unitPrice = product.sellingPrice || 0;
                  const quantity = product.quantity || 0;
                  const discount = product.discount || 0;
                  const discountedPrice = unitPrice * (1 - discount / 100);
                  const totalPrice = discountedPrice * quantity;
                  
                  return (
                    <View key={index} style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : {}
                    ]}>
                      <Text style={[styles.slNoCell]}>{index + 1}</Text>
                      <Text style={[styles.descriptionCell]}>{product.name}</Text>
                      <Text style={[styles.quantityCell]}>{product.quantity}</Text>
                      <Text style={[styles.unitCell]}>{formatCurrency(unitPrice)}</Text>
                      <Text style={[styles.discountCell]}>{product.discount}%</Text>
                      <Text style={[styles.amountCell]}>{formatCurrency(totalPrice)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.totalSellingPrice)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({quotation.globalDiscount}%):</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quotation.totalSellingPrice * (quotation.globalDiscount / 100))}
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({quotation.gstPercentage}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.gstAmount)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Installation:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.totalInstallationCharges)}</Text>
            </View>
            
            <View style={[styles.totalRow, { backgroundColor: '#009245' }]}>
              <Text style={[styles.totalLabel, { color: 'white', fontWeight: 'bold' }]}>Total:</Text>
              <Text style={[styles.totalValue, { color: 'white', fontWeight: 'bold' }]}>
                {formatCurrency(quotation.finalPrice)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>{companySettings?.name || "Company Name"} - Quotation Summary</Text>
        </View>
      </Page>
      
      {/* Terms and conditions page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.headerSection}>
            <View style={styles.logoSection}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: '100%', maxHeight: 50 }} 
                />
              )}
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
            </View>
          </View>
          
          <Text style={styles.aboutTitle}>Terms and Conditions</Text>
          
          {appSettings?.presentationTermsAndConditions ? (
            <Text style={styles.aboutText}>
              {appSettings.presentationTermsAndConditions.replace(/<[^>]*>?/gm, ' ')}
            </Text>
          ) : (
            <>
              <Text style={styles.termsText}>
                1. <Text style={{ fontWeight: 'bold' }}>Scope of Work:</Text> {companySettings?.name} agrees to perform the production and services outlined in our individual quotation and this agreement according to the terms and conditions contained herein.
              </Text>
              <Text style={styles.termsText}>
                2. <Text style={{ fontWeight: 'bold' }}>Quotation Validity:</Text> This quotation is valid for 30 days from the date of issue. Prices and availability of materials are subject to change after this period.
              </Text>
              <Text style={styles.termsText}>
                3. <Text style={{ fontWeight: 'bold' }}>Measurement & Design:</Text> All product dimensions and designs are agreed upon in advance. Any changes after production begins may incur additional charges and delay delivery.
              </Text>
              <Text style={styles.termsText}>
                4. <Text style={{ fontWeight: 'bold' }}>Payment Terms:</Text> A 50% advance payment is required to begin production. The remaining 50% must be paid before delivery and installation.
              </Text>
              <Text style={styles.termsText}>
                5. <Text style={{ fontWeight: 'bold' }}>Delivery & Installation:</Text> Estimated delivery dates are approximate. We will coordinate with you for installation scheduling.
              </Text>
              <Text style={styles.termsText}>
                6. <Text style={{ fontWeight: 'bold' }}>Changes & Cancellations:</Text> Any changes to the order must be made in writing. Cancellations after production has begun will incur charges proportional to the work completed.
              </Text>
              <Text style={styles.termsText}>
                7. <Text style={{ fontWeight: 'bold' }}>Warranty:</Text> All products come with a limited warranty against manufacturing defects for a period of 1 year from the installation date. Normal wear and tear, improper use, or damage caused by external factors are not covered.
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text>{companySettings?.name || "Company Name"} - Terms & Conditions</Text>
        </View>
      </Page>
    </Document>
  );
};

export default LandscapeQuote;