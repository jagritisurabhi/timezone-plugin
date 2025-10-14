#!/usr/bin/env python3
"""
Simple script to create placeholder PNG icons for the Chrome extension.
This creates basic colored squares as placeholders.
"""

from PIL import Image, ImageDraw
import os

def create_icon(size, filename):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a blue circle background
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], 
                 fill=(66, 133, 244, 255), outline=(255, 255, 255, 255), width=2)
    
    # Draw a white circle inside
    inner_margin = size // 4
    draw.ellipse([inner_margin, inner_margin, size-inner_margin, size-inner_margin], 
                 fill=(255, 255, 255, 255), outline=(232, 234, 237, 255), width=1)
    
    # Draw clock hands
    center = size // 2
    # Hour hand
    draw.line([center, center, center, center - size//4], 
              fill=(95, 99, 104, 255), width=max(1, size//32))
    # Minute hand
    draw.line([center, center, center + size//4, center], 
              fill=(95, 99, 104, 255), width=max(1, size//48))
    
    # Center dot
    dot_size = max(1, size//32)
    draw.ellipse([center-dot_size, center-dot_size, center+dot_size, center+dot_size], 
                 fill=(95, 99, 104, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # Create icons directory if it doesn't exist
    os.makedirs("icons", exist_ok=True)
    
    # Create different sizes
    create_icon(16, "icons/icon16.png")
    create_icon(48, "icons/icon48.png")
    create_icon(128, "icons/icon128.png")
    
    print("All icons created successfully!")
