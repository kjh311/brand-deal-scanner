import { createClient } from '@/lib/supabase/client'

/**
 * Handle contract file upload to Supabase Storage and database registration.
 * 
 * @param file The file to upload
 * @returns The inserted database row
 * @throws Error with descriptive message if any step fails
 */
export async function uploadContract(file: File) {
  const supabase = createClient()

  // 1. Validation: Type and Size
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF, DOCX, TXT, or Image (JPG, PNG, WEBP).')
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds the 5MB limit. Please compress your file or upload a smaller version.')
  }

  // 2. Auth Check
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be signed in to upload contracts.')
  }

  // 3. Unique Filename Generation
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${crypto.randomUUID()}_${sanitizedName}`
  const filePath = `${user.id}/${fileName}`

  // 4. Storage Upload
  const { error: storageError } = await supabase.storage
    .from('brand-contracts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`)
  }

  // 5. Database Row Insertion
  const { data: dbData, error: dbError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      file_path: filePath,
      source_type: 'file',
      status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup storage if database registration fails to prevent orphan files
    await supabase.storage.from('brand-contracts').remove([filePath])
    throw new Error(`Database registration failed: ${dbError.message}`)
  }

  return dbData
}

/**
 * Register a manually pasted contract.
 * 
 * @param text The pasted contract content
 * @returns The inserted database row
 */
export async function registerManualContract(text: string) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be signed in to analyze contracts.')
  }

  const { data: dbData, error: dbError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      extracted_text: text,
      source_type: 'text_input',
      status: 'ready', // Immediately ready since text is already available
    })
    .select()
    .single()

  if (dbError) {
    throw new Error(`Manual entry registration failed: ${dbError.message}`)
  }

  return dbData
}
