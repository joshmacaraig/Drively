# Supabase Storage Setup for Document Uploads

This guide will help you set up the storage bucket for renter verification documents.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Enter the following details:
   - **Name**: `verification-documents`
   - **Public bucket**: Toggle **OFF** (keep it private for security)
   - Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up policies so authenticated users can upload and view their own documents.

### Option A: Using the Supabase Dashboard (Recommended)

1. In the Storage page, click on the `verification-documents` bucket
2. Click on **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow users to upload their own documents

Click **"Create a policy from scratch"** and enter:

- **Policy Name**: `Users can upload their own documents`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'verification-documents'::text)
AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 2: Allow users to view their own documents

Click **"New Policy"** again:

- **Policy Name**: `Users can view their own documents`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'verification-documents'::text)
AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 3: Allow users to update/replace their documents

Click **"New Policy"** again:

- **Policy Name**: `Users can update their own documents`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'verification-documents'::text)
AND (auth.uid()::text = (storage.foldername(name))[1])
```

#### Policy 4: Allow users to delete their own documents

Click **"New Policy"** again:

- **Policy Name**: `Users can delete their own documents`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'verification-documents'::text)
AND (auth.uid()::text = (storage.foldername(name))[1])
```

### Option B: Using SQL (Alternative Method)

Go to **SQL Editor** in Supabase and run this query:

```sql
-- Create storage bucket (if not already created via UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false);

-- Policy 1: Allow users to upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Configure File Upload Settings (Optional)

1. In the Storage bucket settings, you can configure:
   - **File size limit**: Set maximum file size (e.g., 10MB)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `application/pdf`

## Step 4: Test the Upload

1. Log in as a renter
2. Go to Profile page (`/renter/profile`)
3. Try uploading a document
4. Check the Storage bucket to verify the file was uploaded

## Folder Structure

Files will be organized by user ID:
```
verification-documents/
├── <user-id-1>/
│   ├── philsys_id_url_1234567890.jpg
│   ├── proof_of_address_url_1234567890.pdf
│   └── drivers_license_url_1234567890.jpg
├── <user-id-2>/
│   ├── philsys_id_url_0987654321.jpg
│   └── ...
```

## Security Notes

✅ **Private bucket**: Documents are not publicly accessible
✅ **User isolation**: Users can only access their own documents
✅ **Authenticated only**: Only logged-in users can upload
✅ **Folder-based separation**: Each user's files are in their own folder

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the bucket with the exact name: `verification-documents`
- Check for typos in the bucket name

### Error: "new row violates row-level security policy"
- Make sure you've set up all the storage policies
- Verify the policies are enabled
- Check that the user is authenticated

### Files not showing up
- Check the browser console for errors
- Verify the Storage policies are correct
- Make sure the bucket is created

### Cannot view uploaded images
- Check that the SELECT policy is set up
- Verify the file path in the database matches the storage location

## Admin Access (Optional)

To allow admins to view all documents:

```sql
-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.active_role = 'admin'
  )
);
```

## Next Steps

After setting up storage:
1. Test document uploads
2. Verify files are stored correctly
3. Test document preview/download
4. Set up admin verification workflow
