import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { CompanySettings, QuotationWithDetails, AppSettings } from "@shared/schema";
import { formatCurrency } from "@/lib/calculations";

// Custom formatter for rupee symbol in PDF
// Using Unicode rupee symbol with a space to ensure proper rendering
const formatRupeeForPDF = (amount: number | undefined | null): string => {
  // The PDF renderer has trouble with the rupee symbol, so we use "Rs." instead
  const safeAmount = amount || 0;
  return `Rs. ${safeAmount.toLocaleString('en-IN')}`;
};

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    orientation: 'landscape',
  },
  section: {
    margin: 0,
    padding: 0,
    height: '100%',
    position: 'relative',
  },
  
  // New creative cover page styles
  coverPage: {
    backgroundColor: '#f8f9fa',
    height: '100%',
    position: 'relative',
  },
  coverHeader: {
    backgroundColor: '#009245',
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  coverTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  coverSubtitle: {
    color: '#e8f5e9',
    fontSize: 14,
    marginTop: 5,
    letterSpacing: 0.5,
  },
  coverLogo: {
    width: 100,
    height: 80,
    objectFit: 'contain',
  },
  coverBody: {
    padding: 40,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  coverLeft: {
    width: '60%',
    paddingRight: 30,
  },
  coverRight: {
    width: '40%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 15,
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 20,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009245',
    marginRight: 12,
  },
  featureText: {
    fontSize: 12,
    color: '#555555',
  },
  customerCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  customerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#009245',
    marginBottom: 15,
    textAlign: 'center',
  },
  customerField: {
    marginBottom: 10,
  },
  quotationCard: {
    backgroundColor: '#009245',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  quotationLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
  },
  quotationNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quotationDate: {
    color: '#e8f5e9',
    fontSize: 10,
    marginTop: 5,
  },
  
  // Original styles (keeping for other pages)
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
  coverFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#009245',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 10,
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
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: '85%',
    width: '95%',
    margin: 'auto',
  },
  singleRoomImage: {
    width: '100%',
    height: '100%',
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
  featureTextOld: {
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
  const sortedRooms = quotation.rooms ? quotation.rooms.filter(room => room && room.included).map(room => {
    const sortedImages = [...(room.images || [])].sort((a, b) => {
      // First sort by order
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      
      // Then prioritize 3D views over 2D views
      const aIs3D = (a.type || "").toLowerCase().includes("3d");
      const bIs3D = (b.type || "").toLowerCase().includes("3d");
      
      if (aIs3D && !bIs3D) return -1;
      if (!aIs3D && bIs3D) return 1;
      
      // Finally alphabetical by type
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
      {/* First page - New Creative Cover Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Header with company branding */}
          <View style={styles.coverHeader}>
            <View>
              <Text style={styles.coverTitle}>
                {companySettings?.name || "Interior Design Studio"}
              </Text>
              <Text style={styles.coverSubtitle}>
                PREMIUM MODULAR INTERIOR SOLUTIONS
              </Text>
            </View>
            {companySettings?.logo && (
              <Image 
                src={companySettings.logo} 
                style={styles.coverLogo}
              />
            )}
          </View>
          
          {/* Main content area */}
          <View style={styles.coverBody}>
            {/* Left side - Company information and features */}
            <View style={styles.coverLeft}>
              <Text style={styles.welcomeText}>
                Welcome to Your Dream Interior
              </Text>
              <Text style={styles.descriptionText}>
                Transform your space with our premium modular interior solutions. 
                We specialize in creating beautiful, functional environments that 
                reflect your unique style and enhance your daily living experience.
              </Text>
              
              {/* Company details */}
              <View style={{ marginBottom: 25 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 10 }}>
                  Contact Information
                </Text>
                <Text style={{ fontSize: 12, color: '#333333', marginBottom: 5 }}>
                  📍 {companySettings?.address || "Address"}
                </Text>
                <Text style={{ fontSize: 12, color: '#333333', marginBottom: 5 }}>
                  📞 {companySettings?.phone || "Phone"}
                </Text>
                <Text style={{ fontSize: 12, color: '#333333', marginBottom: 5 }}>
                  ✉️ {companySettings?.email || "Email"}
                </Text>
                {companySettings?.website && (
                  <Text style={{ fontSize: 12, color: '#333333', marginBottom: 5 }}>
                    🌐 {companySettings.website}
                  </Text>
                )}
              </View>
              
              {/* Feature highlights */}
              <View>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 15 }}>
                  Why Choose Us?
                </Text>
                <View style={styles.featureHighlight}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Premium quality materials and finishes</Text>
                </View>
                <View style={styles.featureHighlight}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Expert design consultation and planning</Text>
                </View>
                <View style={styles.featureHighlight}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Timely delivery and professional installation</Text>
                </View>
                <View style={styles.featureHighlight}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Comprehensive warranty and after-sales support</Text>
                </View>
                <View style={styles.featureHighlight}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Customized solutions for every space</Text>
                </View>
              </View>
            </View>
            
            {/* Right side - Customer and quotation details */}
            <View style={styles.coverRight}>
              {/* Customer information card */}
              <View style={styles.customerCard}>
                <Text style={styles.customerTitle}>Client Details</Text>
                <View style={styles.customerField}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{quotation?.customer?.name || "Customer Name"}</Text>
                </View>
                <View style={styles.customerField}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{quotation?.customer?.address || "Address"}</Text>
                </View>
                <View style={styles.customerField}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{quotation?.customer?.phone || "Phone"}</Text>
                </View>
                <View style={styles.customerField}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{quotation?.customer?.email || "Email"}</Text>
                </View>
              </View>
              
              {/* Quotation details card */}
              <View style={styles.quotationCard}>
                <Text style={styles.quotationLabel}>QUOTATION NUMBER</Text>
                <Text style={styles.quotationNumber}>{quotation?.quotationNumber || "QT-0000"}</Text>
                <Text style={styles.quotationDate}>
                  {quotation?.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Date"}
                </Text>
              </View>
              
              {/* Total amount preview */}
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#666666', marginBottom: 5 }}>
                  Total Project Value
                </Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#009245' }}>
                  {formatRupeeForPDF(quotation?.finalPrice || 0)}
                </Text>
                <Text style={{ fontSize: 10, color: '#666666', marginTop: 5 }}>
                  *Including all taxes and installation
                </Text>
              </View>
            </View>
          </View>
          
          {/* Footer */}
          <View style={styles.coverFooter}>
            <Text style={styles.footerText}>Page 1 of {totalPages}</Text>
            <Text style={styles.footerText}>
              {companySettings?.website || "www.interiordesign.com"}
            </Text>
          </View>
        </View>
      </Page>
      
      {/* Second page - Enhanced Features Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={{ ...styles.section, padding: 30 }}>
          {/* Header with gradient background */}
          <View style={{ 
            backgroundColor: '#f8f9fa', 
            padding: 20, 
            borderRadius: 8,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View style={{ width: '70%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#009245', marginBottom: 5 }}>
                About {companySettings?.name || "Our Company"}
              </Text>
              <Text style={{ fontSize: 12, color: '#666666' }}>
                Excellence in every detail, innovation in every design
              </Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: 80, height: 60, objectFit: 'contain' }} 
                />
              )}
            </View>
          </View>
          
          {/* Company description */}
          <View style={{ marginBottom: 25 }}>
            {appSettings?.presentationSecondPageContent ? (
              <Text style={{ fontSize: 13, lineHeight: 1.6, color: '#333333', textAlign: 'justify' }}>
                {appSettings.presentationSecondPageContent.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, lineHeight: 1.6, color: '#333333', textAlign: 'justify' }}>
                {companySettings?.name || "Our company"} is a premier interior design firm specializing in creating exceptional living 
                and working spaces that reflect our clients' unique styles and needs. With a dedicated team 
                of designers and craftsmen, we combine innovative design with functionality to deliver spaces 
                that inspire and delight.
                
                Our process begins with understanding your vision, lifestyle, and requirements before crafting 
                customized solutions that blend aesthetics with practicality. We believe that great design 
                should not only look beautiful but also enhance your daily living experience.
              </Text>
            )}
          </View>
          
          {/* Enhanced feature grid */}
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between',
            marginTop: 10
          }}>
            <View style={{ 
              width: '48%', 
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: '#009245'
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>
                🏆 Premium Quality
              </Text>
              <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                We use only the highest quality materials sourced from trusted suppliers, ensuring durability and elegance in every project.
              </Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: '#009245'
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>
                👨‍🔧 Expert Craftsmen
              </Text>
              <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                Our skilled team of designers and craftsmen ensures precise execution of your design vision with attention to every detail.
              </Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: '#009245'
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>
                ⏰ Timely Delivery
              </Text>
              <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                We commit to delivering your project within the agreed timeframe without compromising on quality or craftsmanship.
              </Text>
            </View>
            
            <View style={{ 
              width: '48%', 
              backgroundColor: '#fff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: '#009245'
            }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>
                🛠️ After-Sales Support
              </Text>
              <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                Our service doesn't end with installation. We provide comprehensive warranty and ongoing support for complete peace of mind.
              </Text>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ width: '65%' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245' }}>
                      {room.name} - {image.type || "Room Image"}
                    </Text>
                  </View>
                  <View style={{ width: '25%', alignItems: 'flex-end' }}>
                    {companySettings?.logo && (
                      <Image 
                        src={companySettings.logo} 
                        style={{ width: 120, objectFit: 'contain' }} 
                      />
                    )}
                  </View>
                </View>
                
                <View style={styles.imageContainer}>
                  <Image 
                    src={image.path} 
                    style={styles.singleRoomImage}
                  />
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ width: '65%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#009245', marginBottom: 15 }}>Project Cost Summary</Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: 120, objectFit: 'contain' }} 
                />
              )}
            </View>
          </View>
          
          {/* Cost Summary Table - Matching the screenshot */}
          <View style={{ marginVertical: 20, maxHeight: '70%' }}>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#e8f5e9', padding: 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', color: '#009245', fontSize: 10 }}>PRODUCT DESCRIPTION</Text>
              <Text style={{ flex: 1, fontWeight: 'bold', color: '#009245', textAlign: 'right', fontSize: 10 }}>SELLING PRICE</Text>
              <Text style={{ flex: 1, fontWeight: 'bold', color: '#009245', textAlign: 'right', fontSize: 10 }}>DISCOUNTED PRICE ({quotation.globalDiscount}%)</Text>
            </View>
            
            {/* Room Rows - use smaller font and padding when many rooms */}
            <View style={{ maxHeight: '65%' }}>
              {sortedRooms.map((room, index) => (
                <View key={index} style={{ flexDirection: 'row', backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white', padding: sortedRooms.length > 5 ? 6 : 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
                  <Text style={{ flex: 2, fontWeight: 'bold', fontSize: sortedRooms.length > 5 ? 9 : 10 }}>{room.name.toUpperCase()}</Text>
                  <Text style={{ flex: 1, textAlign: 'right', fontSize: sortedRooms.length > 5 ? 9 : 10 }}>{formatRupeeForPDF(room.sellingPrice || 0)}</Text>
                  <Text style={{ flex: 1, textAlign: 'right', color: 'red', fontSize: sortedRooms.length > 5 ? 9 : 10 }}>
                    {formatRupeeForPDF((room.sellingPrice || 0) * (1 - quotation.globalDiscount / 100))}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Total Row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 10 }}>Total Of All Items</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>{formatRupeeForPDF(quotation.totalSellingPrice)}</Text>
              <Text style={{ flex: 1, textAlign: 'right', color: 'red', fontSize: 10 }}>
                {formatRupeeForPDF(quotation.totalSellingPrice * (1 - quotation.globalDiscount / 100))}
              </Text>
            </View>
            
            {/* Installation Row */}
            <View style={{ flexDirection: 'row', padding: 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 10 }}>Installation and Handling</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>{formatRupeeForPDF(quotation.totalInstallationCharges)}</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>{formatRupeeForPDF(quotation.totalInstallationCharges)}</Text>
            </View>
            
            {/* GST Row */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 10 }}>GST {quotation.gstPercentage}%</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>{formatRupeeForPDF(quotation.gstAmount)}</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>
                {formatRupeeForPDF(quotation.gstAmount * (1 - quotation.globalDiscount / 100))}
              </Text>
            </View>
            
            {/* Final Price Row */}
            <View style={{ flexDirection: 'row', padding: 8, borderBottom: 1, borderBottomColor: '#ddd' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 10 }}>Final Price</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: 10 }}>{formatRupeeForPDF(quotation.finalPrice)}</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: 'red', fontSize: 10 }}>
                {formatRupeeForPDF(quotation.finalPrice * (1 - quotation.globalDiscount / 100) + quotation.totalInstallationCharges)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Page {totalPages - 1} of {totalPages}</Text>
          <Text>{companySettings?.website || ""}</Text>
        </View>
      </Page>
      
      {/* Terms and Conditions Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ width: '65%' }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245' }}>Terms & Conditions</Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end' }}>
              {companySettings?.logo && (
                <Image 
                  src={companySettings.logo} 
                  style={{ width: 120, objectFit: 'contain' }} 
                />
              )}
            </View>
          </View>
          
          <View style={{ marginTop: 20 }}>
            {appSettings?.defaultTermsAndConditions ? (
              <Text style={{ fontSize: 12, lineHeight: 1.5, color: '#333333' }}>
                {appSettings.defaultTermsAndConditions.replace(/<[^>]*>?/gm, ' ')}
              </Text>
            ) : (
              <View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>1. Scope of Services</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
                  This quotation covers the design, supply, and installation of modular interior solutions as specified in the project details.
                  Any modifications to the scope will require a revised quotation.
                </Text>
                
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>2. Pricing and Payment</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
                  • All prices are in Indian Rupees (INR) and valid for 30 days from the date of issue.
                  • Payment terms: 50% advance with order confirmation, 40% before delivery, and 10% upon completion.
                  • GST and other applicable taxes will be charged as per government regulations.
                </Text>
                
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>3. Timeline</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
                  • Manufacturing will commence upon receipt of advance payment and signed approval of designs.
                  • Standard delivery time is 4-6 weeks from order confirmation, subject to material availability.
                  • Installation timeline will be provided in the project schedule and may vary based on site conditions.
                </Text>
                
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>4. Warranty</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
                  • All products carry a 12-month warranty against manufacturing defects under normal use.
                  • Warranty excludes damage caused by misuse, improper maintenance, or unauthorized modifications.
                </Text>
                
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>5. Cancellation and Changes</Text>
                <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
                  • Orders cannot be cancelled after production begins. Cancellation before production starts will incur a 10% fee.
                  • Changes to the design after approval may result in additional costs and timeline extensions.
                </Text>
              </View>
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
