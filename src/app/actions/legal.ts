'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function publishLegalVersion(termsText: string, privacyText: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const publishedAt = new Date().toISOString()

  const { error } = await supabase
    .from('terms_versions')
    .insert({
      terms_text: termsText,
      privacy_text: privacyText,
      version_name: publishedAt,
    })

  if (error) {
    throw new Error(error.message || 'Failed to publish legal documents.')
  }

  revalidatePath('/admin')
  revalidatePath('/terms')
  revalidatePath('/privacy')

  return { success: true }
}
