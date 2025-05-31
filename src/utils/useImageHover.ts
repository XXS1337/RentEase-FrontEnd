import { useState, useEffect } from 'react';

// Custom hook to manage hover-based image preview positioning
export function useImageHover() {
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Stores the preview image URL
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null); // Stores the position for image preview
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number }>({ width: 500, height: 500 }); // Stores the current preview box size

  // Called when mouse enters the zoom icon
  const onMouseEnter = (e: React.MouseEvent, image: string) => {
    // Prevent preview on small screens
    if (window.innerWidth < 850) return;

    // Set preview size based on current screen width
    if (window.innerWidth >= 850 && window.innerWidth < 1200) {
      setPreviewSize({ width: 350, height: 350 }); // Medium screens
    } else if (window.innerWidth >= 1200 && window.innerWidth < 1500) {
      setPreviewSize({ width: 400, height: 400 }); // Large screens
    } else {
      setPreviewSize({ width: 500, height: 500 }); // Extra large screens
    }

    // Store image and initial mouse position
    setPreviewImage(image);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  };

  // Called when mouse leaves the zoom icon
  const onMouseLeave = () => {
    // Always reset image and position on leave
    setPreviewImage(null);
    setHoverPosition(null);
  };

  // Called while mouse is moving over the zoom icon
  const onMouseMove = (e: React.MouseEvent) => {
    if (window.innerWidth < 850) return; // Ignore tracking for mobile screens

    // Get the size of the preview to calculate position
    const { width, height } = previewSize;

    // Calculate whether to show preview left/right and top/bottom based on space
    const offsetX = e.clientX + width > window.innerWidth ? -width - 20 : 10;
    const offsetY = e.clientY + height > window.innerHeight ? -height - 20 : 10;

    // Update preview position accordingly
    setHoverPosition({ x: e.clientX + offsetX, y: e.clientY + offsetY });
  };

  // Listen for Escape key to close the preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
        setHoverPosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    previewImage,
    hoverPosition,
    previewSize,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    setPreviewImage,
  };
}
