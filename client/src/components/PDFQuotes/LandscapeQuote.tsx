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

// Format date function for PDF
const formatDateForPDF = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  descriptionCell: {
    width: '50%',
  },
  quantityCell: {
    width: '12%',
    textAlign: 'center',
  },
  unitCell: {
    width: '24%',
    textAlign: 'right',
  },
  discountCell: {
    width: '12%',
    textAlign: 'center',
  },
  amountCell: {
    width: '26%',
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
  // New styles for presentation quote matching layout
  logoArea: {
    textAlign: 'center',
    paddingVertical: 25,
    paddingTop: 40,
    borderBottomWidth: 5,
    borderBottomColor: '#009245',
  },
  companyNameCover: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  greenBorder: {
    height: 5,
    backgroundColor: '#009245',
    marginTop: 10,
  },
  quotationTitleArea: {
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A7A7A',
    letterSpacing: 1,
  },
  redLine: {
    height: 2,
    backgroundColor: '#D81F28',
    marginTop: 8,
    width: '100%',
  },
  projectInfoBox: {
    position: 'absolute',
    bottom: 80,
    left: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    width: '60%',
    borderLeftWidth: 4,
    borderLeftColor: '#D81F28',
  },
  projectInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  projectInfoLabel: {
    fontWeight: 'bold',
    color: '#009245',
    width: 80,
    fontSize: 12,
  },
  projectInfoValue: {
    color: '#000000',
    fontSize: 12,
    flex: 1,
  },
  greenFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#009245',
    padding: 12,
    textAlign: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 10,
  },
  
  // Green-red footer line
  footerLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
  },
  footerLineGreen: {
    backgroundColor: '#009245',
    flex: 0.75, // 75% width
  },
  footerLineRed: {
    backgroundColor: '#FF0000',
    flex: 0.25, // 25% width
  },
  
  // Room page styles
  roomPageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 30,
  },
  roomPageContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 30,
  },
  imageContainer: {
    flex: 1,
    marginTop: 20,
    marginBottom: 60,
    marginLeft: 30,
    marginRight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleRoomImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
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
    
    // Count room name pages and image pages
    sortedRooms.forEach(room => {
      pageCount += 1; // Room name page
      pageCount += room.images?.length || 0; // Image pages
    });
    
    // Add summary page
    pageCount += 1;
    
    return pageCount;
  };
  
  const totalPages = getTotalPages();

  return (
    <Document>
      {/* First page - Cover Page matching Presentation Quote */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Logo Area with border */}
        <View style={styles.logoArea}>
          <Text style={styles.companyNameCover}>{companySettings?.name || "DesignQuotes"}</Text>
        </View>
        
        {/* Quotation Title */}
        <View style={styles.quotationTitleArea}>
          <Text style={styles.quotationTitle}>MODULAR INTERIOR QUOTATION</Text>
          <View style={styles.redLine} />
        </View>
        
        {/* Project Info Box - positioned similar to presentation quote */}
        <View style={styles.projectInfoBox}>
          <View style={styles.projectInfoRow}>
            <Text style={styles.projectInfoLabel}>Client:</Text>
            <Text style={styles.projectInfoValue}>{quotation?.customer?.name || "N/A"}</Text>
          </View>
          <View style={styles.projectInfoRow}>
            <Text style={styles.projectInfoLabel}>Date:</Text>
            <Text style={styles.projectInfoValue}>{formatDateForPDF(quotation.createdAt)}</Text>
          </View>
          <View style={styles.projectInfoRow}>
            <Text style={styles.projectInfoLabel}>Quotation #:</Text>
            <Text style={styles.projectInfoValue}>{quotation?.quotationNumber || "QT-0000"}</Text>
          </View>
        </View>
        
        {/* Green Footer */}
        <View style={styles.greenFooter}>
          <Text style={styles.footerText}>{companySettings?.website || "www.yourcompany.com"}</Text>
        </View>
        
        {/* Green-Red Footer Line */}
        <View style={styles.footerLine}>
          <View style={styles.footerLineGreen} />
          <View style={styles.footerLineRed} />
        </View>
      </Page>
      
      {/* Second page - Features Page matching Presentation Quote */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <Text style={styles.companyNameCover}>{companySettings?.name || "DesignQuotes"}</Text>
        </View>
        
        {/* Features Content - rendered with proper HTML-like formatting */}
        <View style={{ padding: 30, maxHeight: 450, overflow: 'hidden' }}>
          {appSettings?.landscapeSecondPageContent ? (
            <View>
              {/* Why Choose Us Section */}
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#009245', marginBottom: 15 }}>Why Choose Us</Text>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#009245', borderRadius: 4, marginTop: 4, marginRight: 8 }} />
                  <Text style={{ fontSize: 11, lineHeight: 1.4, color: '#333333', flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>Premium Quality Materials: </Text>
                    Best-in-class raw materials ensuring durability
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#009245', borderRadius: 4, marginTop: 4, marginRight: 8 }} />
                  <Text style={{ fontSize: 11, lineHeight: 1.4, color: '#333333', flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>Expert Installation: </Text>
                    Professional team with years of experience
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#009245', borderRadius: 4, marginTop: 4, marginRight: 8 }} />
                  <Text style={{ fontSize: 11, lineHeight: 1.4, color: '#333333', flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>Timely Delivery: </Text>
                    Project completion within agreed timelines
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#009245', borderRadius: 4, marginTop: 4, marginRight: 8 }} />
                  <Text style={{ fontSize: 11, lineHeight: 1.4, color: '#333333', flex: 1 }}>
                    <Text style={{ fontWeight: 'bold' }}>After-Sales Support: </Text>
                    Comprehensive warranty and maintenance
                  </Text>
                </View>
              </View>

              {/* Our Process Section */}
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#009245', marginBottom: 15 }}>Our Process</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: '#009245', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>1</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>CONSULTATION</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: '#009245', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>2</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>DESIGN</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: '#009245', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>3</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>PRODUCTION</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: '#009245', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>4</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>INSTALLATION</Text>
                </View>
              </View>

              {/* Client Testimonial */}
              <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#009245' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>Client Testimonial</Text>
                <Text style={{ fontSize: 11, fontStyle: 'italic', color: '#333333', marginBottom: 8 }}>
                  "The landscape PDF format perfectly showcases our project details. The team's professionalism and attention to detail exceeded our expectations!"
                </Text>
                <Text style={{ fontSize: 10, color: '#666666' }}>- Satisfied Client</Text>
              </View>
            </View>
          ) : appSettings?.presentationSecondPageContent ? (
            <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#333333', textAlign: 'justify' }}>
              {appSettings.presentationSecondPageContent.replace(/<[^>]*>?/gm, ' ').substring(0, 2500)}
            </Text>
          ) : (
            <View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#009245', marginBottom: 15 }}>Our Features</Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <View style={{ width: '48%', marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>Best Quality Materials</Text>
                  <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                    Premium raw materials and fittings to ensure durability and elegance.
                  </Text>
                </View>
                
                <View style={{ width: '48%', marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>Fast Delivery</Text>
                  <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                    Prompt project execution with strict timeline adherence.
                  </Text>
                </View>
                
                <View style={{ width: '48%', marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>Hassle-Free Installation</Text>
                  <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                    Expert installation team ensures minimal disruption to your routine.
                  </Text>
                </View>
                
                <View style={{ width: '48%', marginBottom: 15 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 8 }}>Eco-Friendly Options</Text>
                  <Text style={{ fontSize: 11, color: '#666666', lineHeight: 1.4 }}>
                    Sustainable materials that care for both your home and the environment.
                  </Text>
                </View>
              </View>
              
              {/* Client Testimonial */}
              <View style={{ marginTop: 20, backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#009245' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#009245', marginBottom: 8 }}>What Our Clients Say</Text>
                <Text style={{ fontSize: 12, color: '#333333', fontStyle: 'italic', marginBottom: 8 }}>
                  "The team's attention to detail and commitment to quality exceeded our expectations. Our home has been completely transformed!"
                </Text>
                <Text style={{ fontSize: 10, color: '#666666' }}>- Recent Client</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Green Footer */}
        <View style={styles.greenFooter}>
          <Text style={styles.footerText}>{companySettings?.website || "www.yourcompany.com"}</Text>
        </View>
        
        {/* Green-Red Footer Line */}
        <View style={styles.footerLine}>
          <View style={styles.footerLineGreen} />
          <View style={styles.footerLineRed} />
        </View>
      </Page>
      
      {/* Room Images - Room name page followed by images */}
      {sortedRooms.map((room, roomIndex) => {
        const roomPages = [];
        let currentPageNumber = 3; // Start after cover and features pages
        
        // Calculate page number for this room
        for (let i = 0; i < roomIndex; i++) {
          currentPageNumber += 1; // Room name page
          currentPageNumber += sortedRooms[i].images?.length || 0; // Image pages
        }
        
        // Add room name page
        roomPages.push(
          <Page key={`room-${roomIndex}`} size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.section}>
              {/* Header with proper margins */}
              <View style={{ ...styles.roomPageHeader, marginTop: 30, marginLeft: 30 }}>
                <View style={{ width: '70%' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#009245' }}>
                    {companySettings?.name || "DesignQuotes"}
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
              
              {/* Room content area */}
              <View style={styles.roomPageContent}>
                <Text style={{ fontSize: 32, color: '#009245', textAlign: 'center', fontWeight: 'bold', marginBottom: 20 }}>
                  {room.name}
                </Text>
                {room.description && (
                  <Text style={{ fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 1.6, paddingHorizontal: 40 }}>
                    {room.description}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text>Page {currentPageNumber} of {totalPages}</Text>
              <Text>{companySettings?.website || ""}</Text>
            </View>
            
            {/* Green-Red Footer Line */}
            <View style={styles.footerLine}>
              <View style={styles.footerLineGreen} />
              <View style={styles.footerLineRed} />
            </View>
          </Page>
        );
        currentPageNumber++;
        
        // Add image pages for this room
        if (room.images) {
          room.images.forEach((image, imageIndex) => {
            roomPages.push(
              <Page key={`${roomIndex}-${imageIndex}`} size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.section}>
                  {/* Header with proper margins */}
                  <View style={{ ...styles.imagePageHeader, marginTop: 30, marginLeft: 30 }}>
                    <View style={{ width: '70%' }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#009245' }}>
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
                  
                  {/* Image container with proper margins */}
                  <View style={styles.imageContainer}>
                    <Image 
                      src={image.path} 
                      style={styles.singleRoomImage}
                    />
                  </View>
                </View>
                
                <View style={styles.footer}>
                  <Text>Page {currentPageNumber} of {totalPages}</Text>
                  <Text>{companySettings?.website || ""}</Text>
                </View>
                
                {/* Green-Red Footer Line */}
                <View style={styles.footerLine}>
                  <View style={styles.footerLineGreen} />
                  <View style={styles.footerLineRed} />
                </View>
              </Page>
            );
            currentPageNumber++;
          });
        }
        
        return roomPages;
      }).flat()}
      
      {/* Summary Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          {/* Header with proper margins */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 30, marginLeft: 30, marginRight: 30 }}>
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
          
          {/* Cost Summary Table - Centered and formatted like basic quote */}
          <View style={{ marginVertical: 20, marginHorizontal: 30, alignItems: 'center' }}>
            <View style={{ width: '90%' }}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' }]}>
                <Text style={[styles.descriptionCell, { fontSize: 10, fontWeight: 'bold', color: '#374151' }]}>PRODUCT DESCRIPTION</Text>
                <Text style={[styles.unitCell, { fontSize: 10, fontWeight: 'bold', color: '#374151', textAlign: 'right' }]}>SELLING PRICE</Text>
                <Text style={[styles.amountCell, { fontSize: 10, fontWeight: 'bold', color: '#374151', textAlign: 'right' }]}>DISCOUNTED PRICE ({quotation.globalDiscount}%)</Text>
              </View>
              
              {/* Room Rows */}
              {sortedRooms.map((room, index) => (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb', borderWidth: 1, borderColor: '#d1d5db' }]}>
                  <Text style={[styles.descriptionCell, { fontSize: 9, padding: 4 }]}>{room.name.toUpperCase()}</Text>
                  <Text style={[styles.unitCell, { fontSize: 9, padding: 4, textAlign: 'right' }]}>{formatRupeeForPDF(room.sellingPrice || 0)}</Text>
                  <Text style={[styles.amountCell, { fontSize: 9, padding: 4, textAlign: 'right', color: '#D81F28' }]}>
                    {formatRupeeForPDF((room.sellingPrice || 0) * (1 - quotation.globalDiscount / 100))}
                  </Text>
                </View>
              ))}
              
              {/* Total Row */}
              <View style={[styles.tableRow, { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' }]}>
                <Text style={[styles.descriptionCell, { fontSize: 9, padding: 4, fontWeight: 'bold' }]}>Total Of All Items</Text>
                <Text style={[styles.unitCell, { fontSize: 9, padding: 4, fontWeight: 'bold', textAlign: 'right' }]}>{formatRupeeForPDF(quotation.totalSellingPrice)}</Text>
                <Text style={[styles.amountCell, { fontSize: 9, padding: 4, fontWeight: 'bold', textAlign: 'right', color: '#D81F28' }]}>
                  {formatRupeeForPDF(quotation.totalSellingPrice * (1 - quotation.globalDiscount / 100))}
                </Text>
              </View>
              
              {/* Installation Row */}
              <View style={[styles.tableRow, { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' }]}>
                <Text style={[styles.descriptionCell, { fontSize: 9, padding: 4 }]}>Installation and Handling</Text>
                <Text style={[styles.unitCell, { fontSize: 9, padding: 4, textAlign: 'right' }]}>{formatRupeeForPDF(quotation.totalInstallationCharges)}</Text>
                <Text style={[styles.amountCell, { fontSize: 9, padding: 4, textAlign: 'right' }]}>{formatRupeeForPDF(quotation.totalInstallationCharges)}</Text>
              </View>
              
              {/* GST Row */}
              <View style={[styles.tableRow, { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' }]}>
                <Text style={[styles.descriptionCell, { fontSize: 9, padding: 4 }]}>GST {quotation.gstPercentage}%</Text>
                <Text style={[styles.unitCell, { fontSize: 9, padding: 4, textAlign: 'right' }]}>{formatRupeeForPDF(quotation.gstAmount)}</Text>
                <Text style={[styles.amountCell, { fontSize: 9, padding: 4, textAlign: 'right' }]}>{formatRupeeForPDF(quotation.gstAmount)}</Text>
              </View>
              
              {/* Final Price Row */}
              <View style={[styles.tableRow, { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' }]}>
                <Text style={[styles.descriptionCell, { fontSize: 9, padding: 4, fontWeight: 'bold' }]}>Final Price</Text>
                <Text style={[styles.unitCell, { fontSize: 9, padding: 4 }]}></Text>
                <Text style={[styles.amountCell, { fontSize: 9, padding: 4, fontWeight: 'bold', textAlign: 'right', color: '#D81F28' }]}>
                  {formatRupeeForPDF(quotation.finalPrice)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Page {totalPages - 1} of {totalPages}</Text>
          <Text>{companySettings?.website || ""}</Text>
        </View>
        
        {/* Green-Red Footer Line */}
        <View style={styles.footerLine}>
          <View style={styles.footerLineGreen} />
          <View style={styles.footerLineRed} />
        </View>
      </Page>
      
      {/* Terms and Conditions Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.section}>
          {/* Header with proper margins */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 30, marginLeft: 30, marginRight: 30 }}>
            <View style={{ width: '65%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#009245' }}>Terms & Conditions</Text>
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
          
          {/* Content area with controlled height */}
          <View style={{ marginTop: 20, marginLeft: 30, marginRight: 30, marginBottom: 50, maxHeight: 450, overflow: 'hidden' }}>
            {appSettings?.landscapeTermsAndConditions ? (
              <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#333333' }}>
                {appSettings.landscapeTermsAndConditions.replace(/<[^>]*>?/gm, ' ').substring(0, 2000)}
              </Text>
            ) : appSettings?.presentationTermsAndConditions ? (
              <Text style={{ fontSize: 10, lineHeight: 1.4, color: '#333333' }}>
                {appSettings.presentationTermsAndConditions.replace(/<[^>]*>?/gm, ' ').substring(0, 2000)}
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
        
        {/* Green-Red Footer Line */}
        <View style={styles.footerLine}>
          <View style={styles.footerLineGreen} />
          <View style={styles.footerLineRed} />
        </View>
      </Page>
    </Document>
  );
};

export default LandscapeQuote;
