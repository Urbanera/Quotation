import React from "react";
import { Document, Page, View, Text, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { CompanySettings, QuotationWithDetails, AppSettings, Room } from "@shared/schema";
import { formatCurrency, calculateRoomTotal, calculateQuotationGrandTotal } from "@/lib/calculations";

// Define RoomProduct interface since it's not exported from schema
interface RoomProduct {
  id: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  roomId: number;
  description?: string | null;
  category?: string | null;
}

// Register Font
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v11/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v11/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2", fontWeight: 700 }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  landscapePage: {
    padding: 30,
    flexDirection: 'column',
    backgroundColor: 'white',
    width: '100%',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#009245',
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#009245',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: 'contain',
    objectPosition: 'left',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 5,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    color: '#777777',
    fontFamily: 'Inter',
  },
  aboutSection: {
    margin: '0 auto', 
    width: '80%',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 15,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#333333',
    fontFamily: 'Inter',
    textAlign: 'justify',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 15,
    fontFamily: 'Inter',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 5,
    marginTop: 15,
    fontFamily: 'Inter',
  },
  roomDescription: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 10,
    fontFamily: 'Inter',
    lineHeight: 1.4,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  image: {
    width: '31%',
    height: 150,
    margin: '1%',
    objectFit: 'cover',
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
    fontFamily: 'Inter',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    fontFamily: 'Inter',
  },
  tableRowEven: {
    backgroundColor: '#F9F9F9',
  },
  slNoCell: {
    width: '5%',
  },
  descriptionCell: {
    width: '45%',
  },
  quantityCell: {
    width: '10%',
    textAlign: 'center',
  },
  unitCell: {
    width: '10%',
    textAlign: 'right',
  },
  amountCell: {
    width: '15%',
    textAlign: 'right',
  },
  discountCell: {
    width: '15%',
    textAlign: 'right',
  },
  summaryContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryTable: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    fontSize: 10,
    fontFamily: 'Inter',
  },
  summaryLabel: {
    fontWeight: 'normal',
    color: '#555555',
  },
  summaryValue: {
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#009245',
    paddingTop: 5,
    marginTop: 5,
  },
  termsContainer: {
    marginTop: 30,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  termsText: {
    fontSize: 9,
    color: '#555555',
    fontFamily: 'Inter',
    lineHeight: 1.4,
  },
  customerInfo: {
    marginTop: 30,
    marginBottom: 20,
  },
  customerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  customerDetails: {
    fontSize: 11,
    fontFamily: 'Inter',
    lineHeight: 1.5,
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  customerLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#555555',
  },
  customerValue: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 10,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  heroDivider: {
    width: 100,
    height: 4,
    backgroundColor: '#009245',
    marginVertical: 15,
  },
  heroCustomerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  centeredSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  imagePlaceholder: {
    width: '31%',
    height: 150,
    margin: '1%',
    backgroundColor: '#F5F5F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    color: '#999999',
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
  const companyName = companySettings?.name || "Company Name";
  
  const calculateSubtotal = (rooms: Room[]) => {
    return rooms.reduce((total, room) => total + calculateRoomTotal(room), 0);
  };

  // Helper to render arrays of 3D and 2D images together for a room
  const renderRoomImages = (room: any) => {
    // We need to handle rooms that might not have images property
    // In a real application, you'd have proper data or API endpoints for this
    const roomWithImages = room as unknown as { images?: string[] };
    const allRoomImages = [...(roomWithImages.images || [])];
    
    // If no images, return placeholder message
    if (allRoomImages.length === 0) {
      return (
        <View style={styles.centeredSection}>
          <Text style={styles.subtitle}>No images available for this room</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.imageContainer}>
        {allRoomImages.map((img, index) => (
          <Image key={index} src={img} style={styles.image} />
        ))}
      </View>
    );
  };

  // Rendering the products table
  const renderProductTable = (productsRaw: any[], roomIndex: number) => {
    // Map the raw products to match our RoomProduct interface
    const products = productsRaw.map(p => ({
      id: p.id,
      name: p.name,
      price: p.sellingPrice || 0, // Use sellingPrice as price
      quantity: p.quantity || 0,
      discount: p.discount || 0,
      roomId: p.roomId,
      description: p.description,
      category: null
    }));
    
    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.slNoCell]}>Sl.No.</Text>
          <Text style={[styles.descriptionCell]}>Description</Text>
          <Text style={[styles.quantityCell]}>Qty</Text>
          <Text style={[styles.unitCell]}>Unit Price</Text>
          <Text style={[styles.discountCell]}>Discount</Text>
          <Text style={[styles.amountCell]}>Total</Text>
        </View>
        
        {products.map((product, index) => {
          const unitPrice = product.price || 0;
          const quantity = product.quantity || 0;
          const discount = product.discount || 0;
          const totalAfterDiscount = (unitPrice * quantity) * (1 - discount / 100);
          
          return (
            <View key={index} style={[
              styles.tableRow,
              index % 2 === 0 ? styles.tableRowEven : {}
            ]}>
              <Text style={[styles.slNoCell]}>{index + 1}</Text>
              <Text style={[styles.descriptionCell]}>{product.name}</Text>
              <Text style={[styles.quantityCell]}>{product.quantity}</Text>
              <Text style={[styles.unitCell]}>{formatCurrency(product.price || 0)}</Text>
              <Text style={[styles.discountCell]}>{product.discount}%</Text>
              <Text style={[styles.amountCell]}>{formatCurrency(totalAfterDiscount)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Calculate quotation totals - type casting to fix installation percentage issue
  const subtotal = calculateSubtotal(quotation.rooms as any);
  
  // Extend appSettings to include defaultInstallationPercentage if missing
  const extendedAppSettings = {
    ...appSettings,
    defaultInstallationPercentage: 5 // Default to 5% installation charge
  };
  
  const { grandTotal, gstAmount, installationCharge, grandTotalWithInstallation } = 
    calculateQuotationGrandTotal(quotation, extendedAppSettings as any);

  return (
    <Document>
      {/* Page 1: Cover page with brand logo and customer name */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {companySettings?.logo ? (
            <Image src={companySettings.logo} style={styles.logo} />
          ) : (
            <Text style={styles.title}>{companyName}</Text>
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>Quotation: {quotation.quotationNumber}</Text>
            <Text style={styles.subtitle}>Date: {new Date(quotation.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Interior Design Proposal</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroSubtitle}>Transforming your spaces into exceptional experiences</Text>
          
          <View style={styles.centeredSection}>
            {companySettings?.logo && (
              <Image src={companySettings.logo} style={{
                width: 250,
                height: 100,
                objectFit: 'contain',
                marginBottom: 30,
                marginTop: 30
              }} />
            )}
          </View>
          
          <Text style={styles.heroCustomerName}>For: {quotation.customer?.name}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.termsText}>{companySettings?.name || "Company Name"}</Text>
          <Text style={styles.termsText}>Page 1</Text>
        </View>
      </Page>
      
      {/* Page 2: About the brand */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {companySettings?.logo ? (
            <Image src={companySettings.logo} style={styles.logo} />
          ) : (
            <Text style={styles.title}>{companyName}</Text>
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>Quotation: {quotation.quotationNumber}</Text>
            <Text style={styles.subtitle}>Date: {new Date(quotation.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About {companyName}</Text>
          
          {appSettings?.presentationSecondPageContent ? (
            <View style={styles.aboutText}>
              <Text style={styles.aboutText}>
                {/* Strip HTML and just use the text content */}
                {appSettings.presentationSecondPageContent.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            </View>
          ) : (
            <Text style={styles.aboutText}>
              {companyName} is a premier interior design firm specializing in creating exceptional living 
              and working spaces that reflect our clients' unique styles and needs. With a dedicated team 
              of designers and craftsmen, we combine innovative design with functionality to transform your 
              vision into reality.
              
              Our commitment to quality, attention to detail, and customer satisfaction has made us a 
              trusted name in the industry. We use only the finest materials and work with skilled 
              artisans to ensure every project meets our high standards of excellence.
              
              From concept to completion, we guide you through every step of the design process, making 
              it a collaborative and enjoyable experience. Whether you're looking to renovate a single 
              room or design an entire home, our team is ready to bring your dreams to life.
            </Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.termsText}>{companySettings?.name || "Company Name"}</Text>
          <Text style={styles.termsText}>Page 2</Text>
        </View>
      </Page>
      
      {/* Room-wise pages with images */}
      {quotation.rooms.map((room, roomIndex) => (
        <Page 
          key={`room-${roomIndex}`} 
          size="A4" 
          orientation="landscape" 
          style={styles.page}
        >
          <View style={styles.header}>
            {companySettings?.logo ? (
              <Image src={companySettings.logo} style={styles.logo} />
            ) : (
              <Text style={styles.title}>{companyName}</Text>
            )}
            <View style={styles.headerLeft}>
              <Text style={styles.subtitle}>Quotation: {quotation.quotationNumber}</Text>
              <Text style={styles.subtitle}>Date: {new Date(quotation.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <Text style={styles.roomTitle}>{room.name}</Text>
          {room.description && (
            <Text style={styles.roomDescription}>{room.description}</Text>
          )}
          
          {renderRoomImages(room)}
          
          <View style={styles.footer}>
            <Text style={styles.termsText}>{companySettings?.name || "Company Name"}</Text>
            <Text style={styles.termsText}>Page {roomIndex + 3}</Text>
          </View>
        </Page>
      ))}
      
      {/* Price table page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {companySettings?.logo ? (
            <Image src={companySettings.logo} style={styles.logo} />
          ) : (
            <Text style={styles.title}>{companyName}</Text>
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>Quotation: {quotation.quotationNumber}</Text>
            <Text style={styles.subtitle}>Date: {new Date(quotation.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <Text style={styles.pageTitle}>Quotation Summary</Text>
        
        <View style={styles.customerInfo}>
          <Text style={styles.customerTitle}>Customer Information</Text>
          <View style={styles.customerDetails}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Name:</Text>
              <Text style={styles.customerValue}>{quotation.customer?.name}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Address:</Text>
              <Text style={styles.customerValue}>{quotation.customer?.address}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone:</Text>
              <Text style={styles.customerValue}>{quotation.customer?.phone}</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Email:</Text>
              <Text style={styles.customerValue}>{quotation.customer?.email}</Text>
            </View>
            {quotation.customer?.gstNumber && (
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>GST Number:</Text>
                <Text style={styles.customerValue}>{quotation.customer.gstNumber}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Price breakdown by room */}
        {quotation.rooms.map((room, roomIndex) => (
          <View key={`room-pricing-${roomIndex}`} style={{ marginBottom: 15 }}>
            <Text style={styles.roomTitle}>{room.name} - Price Breakdown</Text>
            {renderProductTable(room.products, roomIndex)}
          </View>
        ))}
        
        {/* Grand total summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {quotation.globalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Global Discount ({quotation.globalDiscount}%):</Text>
                <Text style={styles.summaryValue}>
                  - {formatCurrency(subtotal * (quotation.globalDiscount / 100))}
                </Text>
              </View>
            )}
            
            {appSettings.defaultGstPercentage > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST ({appSettings.defaultGstPercentage}%):</Text>
                <Text style={styles.summaryValue}>{formatCurrency(gstAmount)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(grandTotal)}</Text>
            </View>
            
            {installationCharge > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Installation Charges ({appSettings.defaultInstallationPercentage}%):</Text>
                <Text style={styles.summaryValue}>{formatCurrency(installationCharge)}</Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.summaryLabel, { fontWeight: 'bold', fontSize: 12 }]}>Grand Total:</Text>
              <Text style={[styles.summaryValue, { fontWeight: 'bold', fontSize: 12, color: '#009245' }]}>
                {formatCurrency(grandTotalWithInstallation)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.termsText}>{companySettings?.name || "Company Name"}</Text>
          <Text style={styles.termsText}>Page {quotation.rooms.length + 3}</Text>
        </View>
      </Page>
      
      {/* Terms and conditions page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {companySettings?.logo ? (
            <Image src={companySettings.logo} style={styles.logo} />
          ) : (
            <Text style={styles.title}>{companyName}</Text>
          )}
          <View style={styles.headerLeft}>
            <Text style={styles.subtitle}>Quotation: {quotation.quotationNumber}</Text>
            <Text style={styles.subtitle}>Date: {new Date(quotation.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        
        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          
          {appSettings?.presentationTermsAndConditions ? (
            <View style={styles.termsText}>
              <Text style={styles.termsText}>
                {/* Strip HTML and just use the text content */}
                {appSettings.presentationTermsAndConditions.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            </View>
          ) : (
            <View style={styles.termsText}>
              <Text style={{ marginBottom: 5 }}>1. <Text style={{ fontWeight: 'bold' }}>Scope of Work:</Text> {companyName} agrees to perform the production and services outlined in our individual quotation and this agreement according to the terms and conditions contained herein.</Text>
              <Text style={{ marginBottom: 5 }}>2. <Text style={{ fontWeight: 'bold' }}>Quotation Validity:</Text> This quotation is valid for 30 days from the date of issue. Prices and availability of materials are subject to change after this period.</Text>
              <Text style={{ marginBottom: 5 }}>3. <Text style={{ fontWeight: 'bold' }}>Measurement & Design:</Text> All product dimensions and designs are agreed upon in advance. Any changes after production begins may incur additional charges and delay delivery.</Text>
              <Text style={{ marginBottom: 5 }}>4. <Text style={{ fontWeight: 'bold' }}>Payment Terms:</Text> The payment schedule is as follows:</Text>
              <Text style={{ marginLeft: 15, marginBottom: 3 }}>• 50% advance upon acceptance of quotation</Text>
              <Text style={{ marginLeft: 15, marginBottom: 3 }}>• 40% upon delivery of materials</Text>
              <Text style={{ marginLeft: 15, marginBottom: 5 }}>• 10% upon completion of installation</Text>
              <Text style={{ marginBottom: 5 }}>5. <Text style={{ fontWeight: 'bold' }}>Cancellation:</Text> In the event of cancellation after production has begun, the client shall be liable for costs incurred up to the point of cancellation, including materials, labor, and a 15% administration fee.</Text>
              <Text style={{ marginBottom: 5 }}>6. <Text style={{ fontWeight: 'bold' }}>Delivery:</Text> Standard delivery timeline is 6-8 weeks from confirmation of order unless otherwise specified. We're not responsible for delays due to circumstances beyond our control.</Text>
              <Text style={{ marginBottom: 5 }}>7. <Text style={{ fontWeight: 'bold' }}>Site Readiness:</Text> The installation site must be clean, accessible, and with electrical connections available. Additional charges may apply if our team needs to prepare the site.</Text>
              <Text style={{ marginBottom: 5 }}>8. <Text style={{ fontWeight: 'bold' }}>Warranty:</Text> All products come with a 1-year warranty against manufacturing defects. This excludes damage from misuse, normal wear and tear, or unauthorized modifications.</Text>
              <Text style={{ marginBottom: 5 }}>9. <Text style={{ fontWeight: 'bold' }}>Returns & Refunds:</Text> Custom-made products cannot be returned or refunded except in cases of manufacturing defects. Defective items will be repaired or replaced at our discretion.</Text>
              <Text style={{ marginBottom: 5 }}>10. <Text style={{ fontWeight: 'bold' }}>Ownership:</Text> All goods remain the property of {companyName} until payment has been received in full.</Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.termsText}>{companySettings?.name || "Company Name"}</Text>
          <Text style={styles.termsText}>Page {quotation.rooms.length + 4}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default LandscapeQuote;