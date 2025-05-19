import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { CompanySettings, QuotationWithDetails, AppSettings } from "@shared/schema";
import { formatCurrency } from "@/lib/calculations";

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    orientation: 'landscape',
  },
  section: {
    margin: 10,
    padding: 10,
    height: '90%',
    position: 'relative',
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
    width: '25%',
    alignItems: 'flex-end',
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
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    padding: '10 30',
    fontSize: 9,
    color: '#666666',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  imageContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '60%',
  },
  singleRoomImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
  roomImageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 10,
    marginTop: 20,
  },
  featureGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  featureBox: {
    width: '48%',
    margin: '1%',
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 5,
  },
  featureText: {
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
  // Sort room images by order or type (same as in the preview component)
  const sortedRooms = quotation.rooms ? quotation.rooms.map(room => {
    const sortedImages = [...(room.images || [])].sort((a, b) => {
      // First sort by order, then by type
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return (a.type || "").localeCompare(b.type || "");
    });
    
    return {
      ...room,
      images: sortedImages
    };
  }) : [];

  // Calculate total pages for footer
  const getTotalPages = () => {
    let pageCount = 2; // Cover page + Features page
    
    // Count room image pages
    sortedRooms.forEach(room => {
      pageCount += room.images?.length || 0;
    });
    
    // Add summary page
    pageCount += 1;
    
    return pageCount;
  };
  
  const totalPages = getTotalPages();

  return (
    <Document>
      {/* First page - Cover with logo and customer info */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View style={{ width: '70%', alignItems: 'center' }}>
              <Text style={styles.title}>Modular Interior Quotation</Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ maxWidth: '100%', maxHeight: 60 }} 
                />
              )}
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <View style={{ width: '65%' }}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
              <Text style={styles.text}>{companySettings?.address || "Address"}</Text>
              <Text style={styles.text}>Phone: {companySettings?.phone || "Phone"}</Text>
              <Text style={styles.text}>Email: {companySettings?.email || "Email"}</Text>
            </View>
          </View>
          
          <View style={{ borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 20, marginTop: 30 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '50%' }}>
                <Text style={styles.label}>Customer:</Text>
                <Text style={styles.value}>{quotation?.customer?.name || "Customer Name"}</Text>
                
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{quotation?.customer?.address || "Address"}</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{quotation?.customer?.phone || "Phone"}</Text>
                
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{quotation?.customer?.email || "Email"}</Text>
                
                <Text style={styles.label}>Quotation #:</Text>
                <Text style={styles.value}>{quotation?.quotationNumber || "QT-0000"}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Page 1 of {totalPages}</Text>
          <Text>{companySettings?.website || ""}</Text>
        </View>
      </Page>
      
      {/* Second page - Features */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ width: '65%' }}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ maxWidth: '100%', maxHeight: 50 }} 
                />
              )}
            </View>
          </View>
          
          <Text style={styles.aboutTitle}>About {companySettings?.name || "Our Company"}</Text>
          
          <View style={{ marginTop: 10 }}>
            {appSettings?.presentationSecondPageContent ? (
              <Text style={styles.aboutText}>
                {appSettings.presentationSecondPageContent.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            ) : (
              <Text style={styles.aboutText}>
                {companySettings?.name} is a premier interior design firm specializing in creating exceptional living 
                and working spaces that reflect our clients' unique styles and needs. With a dedicated team 
                of designers and craftsmen, we combine innovative design with functionality.
                
                Our process begins with understanding your vision, lifestyle, and requirements before crafting 
                customized solutions that blend aesthetics with practicality.
              </Text>
            )}
          </View>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Quality Materials</Text>
              <Text style={styles.featureText}>We use only the highest quality materials sourced from trusted suppliers.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Expert Craftsmen</Text>
              <Text style={styles.featureText}>Our skilled team ensures precise execution of your design vision.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>Timely Delivery</Text>
              <Text style={styles.featureText}>We commit to delivering your project within the agreed timeframe.</Text>
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureTitle}>After-Sales Support</Text>
              <Text style={styles.featureText}>Our service doesn't end with installation - we provide ongoing support.</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Page 2 of {totalPages}</Text>
          <Text>{companySettings?.website || ""}</Text>
        </View>
      </Page>
      
      {/* Room Images - one page per image */}
      {sortedRooms.map((room, roomIndex) => 
        room.images && room.images.map((image, imageIndex) => {
          const pageNumber = 3 + roomIndex + imageIndex;
          return (
            <Page key={`${roomIndex}-${imageIndex}`} size="A4" orientation="landscape" style={styles.page}>
              <View style={styles.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <View style={{ width: '65%' }}>
                    <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
                  </View>
                  <View style={{ width: '25%', alignItems: 'flex-end' }}>
                    {companySettings?.logo && (
                      <Image 
                        src={companySettings.logo} 
                        style={{ maxWidth: '100%', maxHeight: 50 }} 
                      />
                    )}
                  </View>
                </View>
                
                <Text style={styles.roomImageTitle}>{image.type || "Room Image"}</Text>
                
                <View style={styles.imageContainer}>
                  <Image 
                    src={image.path} 
                    style={styles.singleRoomImage}
                  />
                </View>
                
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{room.name}</Text>
                  {room.description && (
                    <Text style={{ fontSize: 10, color: '#666666', marginTop: 5 }}>{room.description}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.footer}>
                <Text>Page {pageNumber} of {totalPages}</Text>
                <Text>{companySettings?.website || ""}</Text>
              </View>
            </Page>
          );
        })
      )}
      
      {/* Summary Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ width: '65%' }}>
              <Text style={styles.companyName}>{companySettings?.name || "Company Name"}</Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ maxWidth: '100%', maxHeight: 50 }} 
                />
              )}
            </View>
          </View>
          
          <Text style={styles.roomImageTitle}>Quotation Summary</Text>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '40%', padding: 5 }}>Room</Text>
              <Text style={{ width: '40%', padding: 5 }}>Description</Text>
              <Text style={{ width: '20%', padding: 5, textAlign: 'right' }}>Amount</Text>
            </View>
            
            {sortedRooms.map((room, index) => (
              <View key={index} style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {}
              ]}>
                <Text style={{ width: '40%', padding: 5 }}>{room.name}</Text>
                <Text style={{ width: '40%', padding: 5 }}>{room.description || `${room.products?.length || 0} products`}</Text>
                <Text style={{ width: '20%', padding: 5, textAlign: 'right' }}>{formatCurrency(room.sellingPrice || 0)}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.totalSellingPrice)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({quotation.globalDiscount}%):</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(quotation.totalSellingPrice * (quotation.globalDiscount / 100))}
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Installation:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.totalInstallationCharges)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({quotation.gstPercentage}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.gstAmount)}</Text>
            </View>
            
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 5 }]}>
              <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Total:</Text>
              <Text style={[styles.totalValue, { fontWeight: 'bold', color: '#009245' }]}>
                {formatCurrency(quotation.finalPrice)}
              </Text>
            </View>
          </View>
          
          <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Terms & Conditions</Text>
            {appSettings?.defaultTermsAndConditions ? (
              <Text style={{ fontSize: 9, color: '#666666' }}>
                {appSettings.defaultTermsAndConditions.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            ) : (
              <Text style={{ fontSize: 9, color: '#666666' }}>
                • Quotation is valid for 30 days from the date of issue.
                • Payment terms: 50% advance, 50% before delivery.
                • Delivery time: 4-6 weeks from date of order confirmation.
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Page {totalPages} of {totalPages}</Text>
          <Text>{companySettings?.website || ""}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default LandscapeQuote;
