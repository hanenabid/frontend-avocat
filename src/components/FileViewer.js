import React from 'react';
import { IoDocumentText, IoDownload, IoOpen, IoImage } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

const FileViewer = ({ file, fileName, showPreview = true, className = "" }) => {
  const { t } = useTranslation();

  // Helper function to get file extension
  const getFileExtension = (url) => {
    if (!url) return '';
    // Remove query parameters and get extension
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // Helper function to get filename from URL
  const getFileName = (url) => {
    if (fileName) return fileName;
    if (!url) return 'Unknown File';
    
    try {
      // Extract filename from Cloudinary URL or regular URL
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const cleanName = lastPart.split('?')[0]; // Remove query parameters
      return decodeURIComponent(cleanName) || 'Document';
    } catch (e) {
      return 'Document';
    }
  };

  // Check if file is PDF
  const isPDF = (url) => {
    const extension = getFileExtension(url);
    return extension === 'pdf' || url.includes('.pdf') || url.includes('pdf');
  };

  // Check if file is image
  const isImage = (url) => {
    const extension = getFileExtension(url);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(extension);
  };

  // Get Cloudinary download URL for PDFs
  const getDownloadUrl = (url) => {
    if (!url) return '';
    
    // If it's a Cloudinary URL, add fl_attachment to force download
    if (url.includes('cloudinary.com')) {
      // Insert fl_attachment parameter into Cloudinary URL
      if (url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/fl_attachment/');
      }
    }
    
    return url;
  };

  // Get PDF viewer URL (Google Docs Viewer or similar)
  const getPDFViewerUrl = (url) => {
    if (!url) return '';
    
    // For Cloudinary PDFs, we can use their PDF viewer
    if (url.includes('cloudinary.com')) {
      // Convert to image preview for first page
      if (url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/f_jpg,pg_1/');
      }
    }
    
    // Fallback to Google Docs Viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  const displayFileName = getFileName(file);
  const fileExtension = getFileExtension(file);

  if (!file) {
    return <span className="file-viewer-error">No file available</span>;
  }

  return (
    <div className={`file-viewer ${className}`}>
      {isPDF(file) ? (
        // PDF File Handling
        <div className="pdf-file-container">
          <div className="file-info">
            <IoDocumentText className="file-icon pdf-icon" />
            <div className="file-details">
              <span className="file-name">{displayFileName}</span>
              <span className="file-type">PDF Document</span>
            </div>
          </div>
          
          {showPreview && (
            <div className="pdf-preview">
              <img 
                src={getPDFViewerUrl(file)} 
                alt="PDF Preview"
                className="pdf-thumbnail"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="pdf-preview-fallback" style={{ display: 'none' }}>
                <IoDocumentText size={48} color="#666" />
                <span>PDF Preview Not Available</span>
              </div>
            </div>
          )}
          
          <div className="file-actions">
            <a 
              href={getDownloadUrl(file)} 
              download={displayFileName}
              className="file-action-btn download-btn"
              title={t('common.download', 'Download')}
            >
              <IoDownload />
              {t('common.download', 'Download')}
            </a>
            <a 
              href={file} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-action-btn view-btn"
              title={t('common.openInNewTab', 'Open in New Tab')}
            >
              <IoOpen />
              {t('common.view', 'View')}
            </a>
          </div>
        </div>
      ) : isImage(file) ? (
        // Image File Handling
        <div className="image-file-container">
          <div className="file-info">
            <IoImage className="file-icon image-icon" />
            <div className="file-details">
              <span className="file-name">{displayFileName}</span>
              <span className="file-type">{fileExtension.toUpperCase()} Image</span>
            </div>
          </div>
          
          {showPreview && (
            <div className="image-preview">
              <img 
                src={file} 
                alt={displayFileName}
                className="image-thumbnail"
                onClick={() => window.open(file, '_blank')}
              />
            </div>
          )}
          
          <div className="file-actions">
            <a 
              href={file} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-action-btn view-btn"
              title={t('common.view', 'View')}
            >
              <IoOpen />
              {t('common.view', 'View')}
            </a>
          </div>
        </div>
      ) : (
        // Other File Types
        <div className="other-file-container">
          <div className="file-info">
            <IoDocumentText className="file-icon" />
            <div className="file-details">
              <span className="file-name">{displayFileName}</span>
              <span className="file-type">{fileExtension.toUpperCase()} File</span>
            </div>
          </div>
          
          <div className="file-actions">
            <a 
              href={getDownloadUrl(file)} 
              download={displayFileName}
              className="file-action-btn download-btn"
              title={t('common.download', 'Download')}
            >
              <IoDownload />
              {t('common.download', 'Download')}
            </a>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .file-viewer {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 16px;
          margin: 8px 0;
          background: #fff;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .file-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .pdf-icon {
          color: #dc3545;
        }
        
        .image-icon {
          color: #28a745;
        }
        
        .file-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        
        .file-name {
          font-weight: 600;
          color: #333;
          word-break: break-word;
        }
        
        .file-type {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        
        .pdf-preview, .image-preview {
          margin: 12px 0;
          text-align: center;
        }
        
        .pdf-thumbnail {
          max-width: 200px;
          max-height: 250px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .image-thumbnail {
          max-width: 200px;
          max-height: 200px;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .image-thumbnail:hover {
          transform: scale(1.05);
        }
        
        .pdf-preview-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          color: #666;
          font-size: 14px;
        }
        
        .file-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .file-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          background: #f8f9fa;
          color: #495057;
        }
        
        .download-btn:hover {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }
        
        .view-btn:hover {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .file-viewer-error {
          color: #dc3545;
          font-style: italic;
        }
        
        @media (max-width: 480px) {
          .file-viewer {
            padding: 12px;
          }
          
          .file-actions {
            flex-direction: column;
          }
          
          .file-action-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default FileViewer;