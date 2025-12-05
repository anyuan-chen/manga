import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs (local file for reliability)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface PdfSliceOptions {
  filePath: string;
  pageNumber: number; // 0-indexed (0 = first page)
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number; // Optional scale factor for higher/lower resolution (default: 1.5)
}

export interface PdfSliceResult {
  canvas: HTMLCanvasElement;
  dataUrl: string; // base64 encoded image
  blob: Blob;
}

/**
 * Extracts a specific region from a PDF page and returns it as an image
 * @param options Configuration for the PDF slice operation (pageNumber is 0-indexed)
 * @returns Promise containing the extracted image in multiple formats
 */
export async function slicePdfRegion(
  options: PdfSliceOptions
): Promise<PdfSliceResult> {
  const { filePath, pageNumber, x, y, width, height, scale = 1.5 } = options;

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument(filePath);
  const pdf = await loadingTask.promise;

  // Get the specific page (PDF.js uses 1-indexed pages, so add 1)
  const page = await pdf.getPage(pageNumber + 1);

  // Get the viewport with the specified scale
  const viewport = page.getViewport({ scale });

  // Create a canvas to render the full page
  const fullCanvas = document.createElement('canvas');
  const context = fullCanvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  fullCanvas.height = viewport.height;
  fullCanvas.width = viewport.width;

  // Render the PDF page to the canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  // Create a new canvas for the cropped region
  const croppedCanvas = document.createElement('canvas');
  const croppedContext = croppedCanvas.getContext('2d');

  if (!croppedContext) {
    throw new Error('Could not get cropped canvas context');
  }

  // Scale the coordinates and dimensions
  const scaledX = x * scale;
  const scaledY = y * scale;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Set the dimensions of the cropped canvas
  croppedCanvas.width = scaledWidth;
  croppedCanvas.height = scaledHeight;

  // Draw the cropped region from the full canvas to the cropped canvas
  croppedContext.drawImage(
    fullCanvas,
    scaledX,
    scaledY,
    scaledWidth,
    scaledHeight,
    0,
    0,
    scaledWidth,
    scaledHeight
  );

  // Convert to data URL (base64)
  const dataUrl = croppedCanvas.toDataURL('image/png');

  // Convert to Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not convert canvas to blob'));
      }
    }, 'image/png');
  });

  return {
    canvas: croppedCanvas,
    dataUrl,
    blob,
  };
}

/**
 * Simplified function that returns just the data URL for easy display
 * @param options Configuration for the PDF slice operation
 * @returns Promise containing the base64 data URL
 */
export async function slicePdfRegionToDataUrl(
  options: PdfSliceOptions
): Promise<string> {
  const result = await slicePdfRegion(options);
  return result.dataUrl;
}

/**
 * Function that returns a Blob for file upload or storage
 * @param options Configuration for the PDF slice operation
 * @returns Promise containing the image Blob
 */
export async function slicePdfRegionToBlob(
  options: PdfSliceOptions
): Promise<Blob> {
  const result = await slicePdfRegion(options);
  return result.blob;
}
