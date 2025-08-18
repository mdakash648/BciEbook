import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Pdf from 'react-native-pdf';
import { account, client, storage } from '../lib/appwrite';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

export default function PdfViewerScreen({ navigation, route }) {
  const { pdfUrl, bookTitle, bookAuthor } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [finalPdfUrl, setFinalPdfUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const pdfRef = useRef(null);

  // Extract file ID from Appwrite view URL
  const extractFileIdFromViewUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    // expected: .../storage/buckets/{bucket}/files/{fileId}/view?... or /download
    const parts = url.split('/');
    const idx = parts.findIndex((p) => p === 'files');
    if (idx > -1 && parts[idx + 1]) return parts[idx + 1].split('?')[0]; // Remove query params
    return null;
  };

  // Get PDF file using Appwrite SDK - Download to local file
  const getPdfFile = async (fileUrl) => {
    if (!fileUrl) return null;
    
    try {
      console.log('=== PDF DOWNLOAD DEBUG ===');
      console.log('Getting PDF file for URL:', fileUrl);
      console.log('File URL type:', typeof fileUrl);
      console.log('File URL length:', fileUrl?.length);
      
      // Extract file ID from view URL
      const fileId = extractFileIdFromViewUrl(fileUrl);
      if (!fileId) {
        throw new Error('Could not extract file ID from URL');
      }
      console.log('Extracted file ID:', fileId);
      
      // Ensure authentication
      console.log('Ensuring authentication...');
      const sessions = await account.listSessions();
      console.log('Sessions found:', sessions.sessions?.length || 0);
      
      const current = sessions.sessions?.find((s) => s.current) || sessions.sessions?.[0];
      if (current?.$id) {
        console.log('Using existing session:', current.$id);
        client.setSession(current.$id);
      } else {
        console.log('Creating new JWT...');
        const { jwt } = await account.createJWT();
        if (jwt) {
          console.log('JWT created successfully');
          client.setJWT(jwt);
        } else {
          console.log('Failed to create JWT');
        }
      }
      
      // Use Appwrite SDK to get file download URL
      const { CONFIG } = require('../constants/Config');
      console.log('Using bucket ID:', CONFIG.APPWRITE_PDF_BUCKET_ID);
      
      const downloadUrl = storage.getFileDownload(CONFIG.APPWRITE_PDF_BUCKET_ID, fileId);
      console.log('Generated download URL:', downloadUrl);
      
      // Download file to local storage
      const fileName = `pdf_${fileId}_${Date.now()}.pdf`;
      const localFilePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      console.log('Downloading PDF to:', localFilePath);
      console.log('Document directory path:', RNFS.DocumentDirectoryPath);
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: localFilePath,
        background: true,
        discretionary: true,
        progress: (res) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(progressPercent);
          console.log(`Download progress: ${progressPercent.toFixed(2)}% (${res.bytesWritten}/${res.contentLength} bytes)`);
        },
      }).promise;
      
      console.log('Download result:', downloadResult);
      
      if (downloadResult.statusCode === 200) {
        console.log('PDF downloaded successfully to:', localFilePath);
        const fileUri = `file://${localFilePath}`;
        console.log('File URI for PDF viewer:', fileUri);
        
        // Verify file exists
        const fileExists = await RNFS.exists(localFilePath);
        console.log('File exists check:', fileExists);
        
        if (fileExists) {
          const fileStats = await RNFS.stat(localFilePath);
          console.log('File size:', fileStats.size, 'bytes');
          return fileUri;
        } else {
          throw new Error('Downloaded file does not exist');
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }
      
    } catch (error) {
      console.log('=== PDF DOWNLOAD ERROR ===');
      console.log('Error getting PDF file:', error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      
      // Fallback: try to use view URL if download fails
      try {
        console.log('Trying fallback to view URL...');
        const { CONFIG } = require('../constants/Config');
        const fileId = extractFileIdFromViewUrl(fileUrl);
        if (fileId) {
          const viewUrl = storage.getFileView(CONFIG.APPWRITE_PDF_BUCKET_ID, fileId);
          console.log('Using fallback view URL:', viewUrl);
          return viewUrl;
        }
      } catch (fallbackError) {
        console.log('Fallback URL construction failed:', fallbackError);
        return null;
      }
    }
  };


  
  // Check if local PDF file exists
  const checkLocalPdfExists = async (fileUri) => {
    if (!fileUri || !fileUri.startsWith('file://')) {
      return false;
    }
    
    try {
      const localFilePath = fileUri.replace('file://', '');
      const fileExists = await RNFS.exists(localFilePath);
      console.log('Local PDF file exists check:', fileExists, 'Path:', localFilePath);
      return fileExists;
    } catch (error) {
      console.log('Error checking local PDF file existence:', error);
      return false;
    }
  };
  
  // Re-download PDF file if needed
  const ensurePdfFileAvailable = async (currentPdfUrl, currentFinalPdfUrl) => {
    try {
      // First check if we have a local file and if it still exists
      if (currentFinalPdfUrl && currentFinalPdfUrl.startsWith('file://')) {
        const fileExists = await checkLocalPdfExists(currentFinalPdfUrl);
        if (fileExists) {
          console.log('Local PDF file is still available');
          return currentFinalPdfUrl;
        } else {
          console.log('Local PDF file no longer exists, need to re-download');
        }
      }
      
      // If we don't have a local file or it doesn't exist, download it
      if (currentPdfUrl) {
        console.log('Re-downloading PDF file from:', currentPdfUrl);
        const newPdfFileResult = await getPdfFile(currentPdfUrl);
        if (newPdfFileResult) {
          console.log('PDF file re-downloaded successfully');
          return newPdfFileResult;
        } else {
          throw new Error('Failed to re-download PDF file');
        }
      }
      
      return null;
    } catch (error) {
      console.log('Error ensuring PDF file availability:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('PDF Viewer - URL received:', pdfUrl);
    console.log('PDF Viewer - URL type:', typeof pdfUrl);
    console.log('PDF Viewer - URL length:', pdfUrl?.length);
    console.log('PDF Viewer - Current finalPdfUrl:', finalPdfUrl);
    
    if (!pdfUrl) {
      setError('No PDF URL provided');
      setLoading(false);
      return;
    }

    // Get PDF file asynchronously
    const setupPdfFile = async () => {
      try {
        // First check if we already have a local file and if it still exists
        if (finalPdfUrl && finalPdfUrl.startsWith('file://')) {
          const fileExists = await checkLocalPdfExists(finalPdfUrl);
          if (fileExists) {
            console.log('Using existing local PDF file');
            // File exists, we can use it directly
            setLoading(false);
            return;
          } else {
            console.log('Local PDF file no longer exists, need to re-download');
          }
        }
        
        // If we don't have a local file or it doesn't exist, download it
        const pdfFileResult = await getPdfFile(pdfUrl);
        console.log('PDF Viewer - Generated file path:', pdfFileResult);
        if (pdfFileResult) {
          setFinalPdfUrl(pdfFileResult);
        } else {
          setError('Failed to get PDF file');
          setLoading(false);
        }
      } catch (error) {
        console.log('PDF Viewer - Error getting file:', error);
        setError('Failed to prepare PDF for viewing');
        setLoading(false);
      }
    };

    setupPdfFile();

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('PDF Viewer - Loading timeout');
        setError('PDF loading is taking longer than expected. Please check your connection and try again.');
        setLoading(false);
      }
    }, 30000); // 30 seconds timeout for download

    return () => clearTimeout(timeoutId);
  }, [pdfUrl, finalPdfUrl, loading]);

  const handleLoadComplete = (numberOfPages, filePath) => {
    console.log('PDF loaded successfully:', numberOfPages, 'pages');
    setTotalPages(numberOfPages);
    setLoading(false);
    setPdfLoaded(true);
  };

  const handlePageChanged = (page, numberOfPages) => {
    console.log('Page changed:', page, 'of', numberOfPages);
    setCurrentPage(page);
  };

  const handleError = async (error) => {
    console.log('=== PDF COMPONENT ERROR ===');
    console.log('PDF error:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('Current finalPdfUrl:', finalPdfUrl);
    
    // Try to re-download the PDF if the file is no longer available
    try {
      const reDownloadedUrl = await ensurePdfFileAvailable(pdfUrl, finalPdfUrl);
      if (reDownloadedUrl) {
        console.log('Successfully re-downloaded PDF, updating state');
        setFinalPdfUrl(reDownloadedUrl);
        setError(null);
        setLoading(false);
        setPdfLoaded(false);
        return;
      }
    } catch (reDownloadError) {
      console.log('Re-download failed:', reDownloadError);
    }
    
    setError(`Failed to load PDF. The file may have been removed from device storage. Please try again or open in an external app.`);
    setLoading(false);
  };

  const handleZoomIn = () => {
    if (scale < 3.0) {
      setScale(scale + 0.25);
    }
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.25);
    }
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const goToPage = (page) => {
    if (pdfRef.current && page >= 1 && page <= totalPages) {
      pdfRef.current.setPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowControls(!isFullscreen);
  };


  if (!pdfUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PDF Viewer</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="document-outline" size={64} color="#6C757D" />
          <Text style={styles.errorTitle}>No PDF Available</Text>
          <Text style={styles.errorMessage}>This book doesn't have a PDF file attached.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} />
      
      {/* Header */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{bookTitle || 'PDF Viewer'}</Text>
            {bookAuthor && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>by {bookAuthor}</Text>
            )}
          </View>
                     <View style={styles.headerActions}>
             <TouchableOpacity style={styles.headerAction} onPress={toggleFullscreen}>
               <Icon name={isFullscreen ? "contract" : "expand"} size={20} color="#4A90E2" />
             </TouchableOpacity>
           </View>
        </View>
      )}

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Downloading PDF...</Text>
            {downloadProgress > 0 && (
              <Text style={styles.progressText}>{downloadProgress.toFixed(1)}%</Text>
            )}
            <Text style={styles.loadingSubtext}>This may take a moment for large files</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={64} color="#DC3545" />
            <Text style={styles.errorTitle}>Failed to Load PDF</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            

            
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={async () => {
                 setError(null);
                 setLoading(true);
                 setPdfLoaded(false);
                 setDownloadProgress(0);
                 // Ensure the PDF file is available
                 try {
                   const pdfFileResult = await ensurePdfFileAvailable(pdfUrl, finalPdfUrl);
                   if (pdfFileResult) {
                     setFinalPdfUrl(pdfFileResult);
                   } else {
                     setError('Failed to get PDF file');
                     setLoading(false);
                   }
                 } catch (error) {
                   setError('Failed to prepare PDF for viewing: ' + error.message);
                   setLoading(false);
                 }
               }}>
                 <Text style={styles.retryButtonText}>Try Again</Text>
               </TouchableOpacity>
           </View>
          </View>
        )}

        {!error && finalPdfUrl && (
          <Pdf
            ref={pdfRef}
            source={{ uri: finalPdfUrl }}
            style={styles.pdf}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            enablePaging={true}
            enableRTL={false}
            enableAnnotationRendering={true}
            enableAntialiasing={true}
            spacing={10}
            scale={scale}
            minScale={0.5}
            maxScale={3.0}
            horizontal={false}
            activityIndicator={<ActivityIndicator size="large" color="#4A90E2" />}
            activityIndicatorProps={{ color: '#4A90E2', progressTintColor: '#4A90E2' }}
          />
        )}
      </View>

      {/* Bottom Controls */}
      {showControls && pdfLoaded && (
        <View style={styles.bottomControls}>
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
              <Icon name="remove" size={20} color="#4A90E2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleResetZoom}>
              <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
              <Icon name="add" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          {/* Page Navigation */}
          <View style={styles.pageNavigation}>
            <TouchableOpacity 
              style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]} 
              onPress={goToPreviousPage}
              disabled={currentPage <= 1}
            >
              <Icon name="chevron-back" size={20} color={currentPage <= 1 ? "#6C757D" : "#4A90E2"} />
            </TouchableOpacity>
            
            <View style={styles.pageInfo}>
              <Text style={styles.pageText}>
                {currentPage} / {totalPages}
              </Text>
              <Text style={styles.pageJumpHint}>Swipe to navigate</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]} 
              onPress={goToNextPage}
              disabled={currentPage >= totalPages}
            >
              <Icon name="chevron-forward" size={20} color={currentPage >= totalPages ? "#6C757D" : "#4A90E2"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fullscreen Toggle Button */}
      {!showControls && (
        <TouchableOpacity style={styles.fullscreenToggle} onPress={toggleFullscreen}>
          <Icon name="contract" size={24} color="#4A90E2" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullscreenContainer: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    minWidth: 40,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  pageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    minWidth: 40,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#F1F3F5',
  },
  pageInfo: {
    minWidth: 80,
    alignItems: 'center',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  pageJumpHint: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 2,
  },
  fullscreenToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
