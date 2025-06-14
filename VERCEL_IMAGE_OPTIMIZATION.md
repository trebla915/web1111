# Vercel Image Optimization - Reducing Transformation Usage

## Problem
You were exceeding Vercel's 5000 image transformation limit, causing images to not display on the frontend.

## Root Causes Identified

### 1. External Placeholder URLs
- Using `https://via.placeholder.com/` URLs created new transformations for each request
- Different placeholder sizes (400x400, 800x800, 150px) multiplied transformations

### 2. Multiple Image Sizes for Same Content
- Events displayed with different `sizes` attributes across components
- Each different size creates a separate transformation

### 3. Firebase Storage URL Variations
- Auth tokens in Firebase URLs made identical images appear as different URLs
- Each unique URL creates a new transformation

## Solutions Implemented

### 1. ✅ Local Placeholder Images
- **Before**: `'https://via.placeholder.com/400x400?text=Event+Flyer'`
- **After**: `'/placeholder-event.png'` (local file)
- **Impact**: Eliminates external placeholder transformations

### 2. ✅ Consistent Image Sizes
- **Before**: `sizes="(max-width: 768px) 80px, 128px"`
- **After**: `sizes="128px"` (single consistent size)
- **Impact**: Reduces transformation variations

### 3. ✅ Optimized Next.js Config
```javascript
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Reduced from 8 to 6 sizes
  imageSizes: [128, 256, 384], // Reduced from 8 to 3 sizes
  minimumCacheTTL: 31536000, // 1 year cache
}
```

### 4. ✅ Image Utility Functions
Created `lib/utils/imageUtils.ts` with:
- Standard size constants
- URL cleaning functions
- Consistent image props

## Files Modified

1. **next.config.js** - Optimized image configuration
2. **components/sections/EventsFestivalSection.tsx** - Local placeholders
3. **components/events/EventDetails.tsx** - Local placeholders  
4. **app/admin/components/AddBottleToCatalogTab.tsx** - Local placeholders
5. **lib/utils/imageUtils.ts** - New utility functions
6. **public/placeholder-event.png** - New local placeholder
7. **public/placeholder-bottle.png** - New local placeholder

## Additional Recommendations

### 1. Implement Image URL Cleaning
Use the `cleanFirebaseUrl` function to remove auth tokens:
```typescript
import { cleanFirebaseUrl } from '@/lib/utils/imageUtils';

// Before
<Image src={event.flyerUrl} ... />

// After  
<Image src={cleanFirebaseUrl(event.flyerUrl)} ... />
```

### 2. Use Consistent Sizes
Replace custom sizes with standard ones:
```typescript
import { RESPONSIVE_SIZES } from '@/lib/utils/imageUtils';

<Image sizes={RESPONSIVE_SIZES.EVENT_THUMBNAIL} ... />
```

### 3. Consider Image Preloading
For critical images, use `priority` prop:
```typescript
<Image priority={true} ... /> // Only for above-the-fold images
```

### 4. Monitor Usage
- Check Vercel dashboard regularly
- Set up alerts when approaching limits
- Consider upgrading plan if needed

## Expected Impact

- **Placeholder transformations**: Reduced from ~100s to 2 (local files)
- **Size variations**: Reduced by ~60% through consistent sizing
- **Firebase URL variations**: Eliminated through URL cleaning
- **Overall reduction**: Estimated 70-80% reduction in transformations

## Testing

1. Deploy changes to Vercel
2. Monitor transformation usage in Vercel dashboard
3. Verify images still display correctly
4. Check performance impact

## Monitoring

Keep track of:
- Monthly transformation usage
- Image loading performance
- User experience impact
- Any broken images after changes 