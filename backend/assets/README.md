# Assets Directory

This directory contains static assets used by the application.

## SPSU Logo Integration

The certificate PDF generator now supports the actual SPSU logo!

### How to Add the Logo

1. Save the SPSU logo image as `spsu_logo.png` in this directory (`backend/assets/`)
2. The logo will be automatically detected and used in all generated certificates
3. No server restart required - the logo is loaded dynamically

### Logo Requirements

- **Filename**: Must be named exactly `spsu_logo.png`
- **Format**: PNG (preferred for transparent background) or JPG
- **Size**: 200x200 pixels minimum (will be scaled to 0.8 inch in certificates)
- **Background**: Transparent background recommended for best appearance
- **Quality**: High-resolution image for professional appearance

### Current Behavior

- **If `spsu_logo.png` exists**: The actual SPSU logo will be displayed in certificates
- **If not found**: A placeholder blue circle with "SPSU" text will be used

### Testing the Logo

After adding the logo:
1. Generate a new certificate (subscription or event)
2. Open the PDF and verify the logo appears correctly
3. The logo should be centered in the header, above "Sir Padampat Singhania University"

### Troubleshooting

If the logo doesn't appear:
- Verify the filename is exactly `spsu_logo.png` (case-sensitive on some systems)
- Check the file is in the correct directory: `backend/assets/`
- Ensure the image file is not corrupted
- Check the backend logs for any image loading errors
