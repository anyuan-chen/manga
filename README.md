# Manga Speech Bubble Detector

A Python tool for detecting and extracting pixel locations of speech bubbles in manga images using computer vision techniques.

## Features

- Detects speech bubbles in manga images using OpenCV contour detection
- Returns precise pixel coordinates and bounding boxes
- Configurable filtering parameters for different manga styles
- JSON output format for easy integration
- Visualization support to verify detection results

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
python manga_speech_bubble_detector.py image.jpg
```

### Save Results to JSON

```bash
python manga_speech_bubble_detector.py image.jpg --output results.json
```

### Generate Visualization

```bash
python manga_speech_bubble_detector.py image.jpg --visualize detected_bubbles.jpg
```

### Custom Parameters

```bash
python manga_speech_bubble_detector.py image.jpg \
    --min-area 300 \
    --max-area 60000 \
    --min-aspect 0.2 \
    --max-aspect 6.0
```

## Output Format

The tool outputs speech bubble information in JSON format:

```json
{
  "image_path": "manga_page.jpg",
  "num_speech_bubbles": 5,
  "speech_bubbles": [
    {
      "id": 0,
      "bounding_box": {
        "x": 150,
        "y": 200,
        "width": 180,
        "height": 120
      },
      "center": {
        "x": 240,
        "y": 260
      },
      "area": 18500.5,
      "contour_points": [[x1, y1], [x2, y2], ...]
    }
  ]
}
```

## Parameters

- `--min-area`: Minimum contour area to consider as speech bubble (default: 500)
- `--max-area`: Maximum contour area to consider as speech bubble (default: 50000)
- `--min-aspect`: Minimum width/height ratio (default: 0.3)
- `--max-aspect`: Maximum width/height ratio (default: 5.0)

## How It Works

1. **Preprocessing**: Converts image to grayscale, applies Gaussian blur and adaptive thresholding
2. **Contour Detection**: Uses OpenCV's findContours to identify potential speech bubble shapes
3. **Filtering**: Applies size, aspect ratio, and solidity filters to remove false positives
4. **Extraction**: Returns pixel coordinates, bounding boxes, and contour points for each detected bubble

## Programmatic Usage

```python
from manga_speech_bubble_detector import MangaSpeechBubbleDetector

detector = MangaSpeechBubbleDetector(min_area=500, max_area=50000)
speech_bubbles = detector.detect_speech_bubbles("manga_page.jpg")

for bubble in speech_bubbles:
    print(f"Speech bubble {bubble['id']} at {bubble['center']}")
```