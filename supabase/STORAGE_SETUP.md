# Supabase Storage Setup for Drively

## Overview
This guide will help you set up Supabase Storage to enable image uploads for car listings.

## Step 1: Create Storage Bucket

1. **Go to your Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets
   ```

2. **Click "New Bucket"**

3. **Configure the bucket:**
   - **Name:** `drively-storage`
   - **Public bucket:** Toggle **ON** (so car images are publicly accessible)
   - **File size limit:** 10 MB (default)
   - **Allowed MIME types:** Leave empty to allow all image types

4. **Click "Create Bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up policies to control who can upload/delete images.

### Policy 1: Allow authenticated users to upload

1. Go to **Storage** > **Policies** > **drively-storage**
2. Click "New Policy"
3. Select **"Custom"** policy
4. **Policy name:** `Authenticated users can upload`
5. **Allowed operation:** `INSERT`
6. **Policy definition:**
   ```sql
   (auth.role() = 'authenticated')
   ```
7. Click "Review" then "Save policy"

### Policy 2: Allow public read access

1. Click "New Policy" again
2. Select **"Custom"** policy
3. **Policy name:** `Public can read`
4. **Allowed operation:** `SELECT`
5. **Policy definition:**
   ```sql
   true
   ```
6. Click "Review" then "Save policy"

### Policy 3: Allow owners to delete their images

1. Click "New Policy" again
2. Select **"Custom"** policy
3. **Policy name:** `Owners can delete`
4. **Allowed operation:** `DELETE`
5. **Policy definition:**
   ```sql
   (bucket_id = 'drively-storage'::text)
   AND ((storage.foldername(name))[1] IN (
     SELECT cars.id::text
     FROM cars
     WHERE (cars.owner_id = auth.uid())
   ))
   ```
6. Click "Review" then "Save policy"

## Step 3: Verify Setup

You can verify your setup by:

1. **Check if bucket exists:**
   - Go to Storage > Buckets
   - You should see `drively-storage` listed

2. **Check policies:**
   - Click on `drively-storage` bucket
   - Go to "Policies" tab
   - You should see all 3 policies listed

## Step 4: Test Image Upload

After setup:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign in as a car owner

3. Go to "List a New Car"

4. Try uploading an image

5. Check if images appear in the bucket:
   - Go to Storage > drively-storage
   - You should see folders with car IDs containing uploaded images

## Troubleshooting

### Error: "The resource was not found"
**Solution:** Make sure the bucket name is exactly `drively-storage` (with hyphen, not underscore)

### Error: "new row violates row-level security policy"
**Solution:** Check that your upload policy allows authenticated users:
```sql
(auth.role() = 'authenticated')
```

### Images not showing
**Solution:**
1. Make sure the bucket is set to **Public**
2. Check that the "Public can read" policy is active

### Can't delete images
**Solution:** Check that the delete policy correctly references the cars table and matches car ownership

## Storage Structure

Images are organized as:
```
drively-storage/
  ├── {car-id-1}/
  │   ├── timestamp-0.jpg
  │   ├── timestamp-1.jpg
  │   └── timestamp-2.jpg
  ├── {car-id-2}/
  │   ├── timestamp-0.jpg
  │   └── timestamp-1.jpg
  └── ...
```

Each car gets its own folder identified by the car's UUID.

## Image Specifications

- **Maximum images per car:** 5
- **File size limit:** 10 MB per image
- **Supported formats:** JPG, PNG, GIF, WEBP
- **Primary image:** First uploaded image (or manually selected)

## Next Steps

Once storage is set up, you can:
- Upload car images when listing a new car
- View images on the car details page
- Update/delete images as needed
- Set which image is the primary display image

## Security Notes

- Images are publicly accessible (required for renters to view listings)
- Only car owners can upload images to their car folders
- Only car owners can delete their car images
- All uploads require authentication
- Storage usage is tracked per project (check your Supabase plan limits)

## Additional Configuration (Optional)

### Enable Image Transformations

Supabase Storage supports image transformations on-the-fly:

```typescript
const { data } = supabase.storage
  .from('drively-storage')
  .getPublicUrl('path/to/image.jpg', {
    transform: {
      width: 800,
      height: 600,
      resize: 'cover',
    },
  });
```

This can be useful for:
- Generating thumbnails
- Optimizing image sizes
- Creating different image sizes for responsive design

### Set up CDN (Production)

For production, consider:
1. Using Supabase's built-in CDN
2. Setting appropriate cache headers
3. Implementing image optimization
4. Using lazy loading for better performance
