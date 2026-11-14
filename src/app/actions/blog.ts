'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { slugify, type BlogPost } from '@/lib/blog'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: You must be logged in.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin')
    .eq('id', user.id)
    .single()

  if (!profile?.admin) {
    throw new Error('Unauthorized: Administrator access required.')
  }

  return user
}

export async function publishBlogPost(data: {
  title: string
  slug?: string
  excerpt?: string
  body: string
  published?: boolean
}) {
  await assertAdmin()

  const title = data.title.trim()
  if (!title) {
    throw new Error('Blog title is required.')
  }

  const body = data.body.trim()
  if (!body) {
    throw new Error('Blog body content is required.')
  }

  const baseSlug = (data.slug?.trim() ? slugify(data.slug) : slugify(title)) || 'blog-post'
  const excerpt = data.excerpt?.trim() || null
  const published = data.published ?? true

  // Check if slug already exists to prevent duplicate key error
  let finalSlug = baseSlug
  const { data: existing } = await supabaseAdmin
    .from('blogs')
    .select('id')
    .eq('slug', finalSlug)
    .maybeSingle()

  if (existing) {
    finalSlug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const { data: post, error } = await supabaseAdmin
    .from('blogs')
    .insert({
      title,
      slug: finalSlug,
      excerpt,
      body,
      published,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create blog post:', error)
    throw new Error(error.message || 'Failed to create blog post.')
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${finalSlug}`)
  revalidatePath('/admin')

  return { success: true, post: post as BlogPost }
}

export async function deleteBlogPost(id: string) {
  await assertAdmin()

  if (!id) {
    throw new Error('Blog post ID is required.')
  }

  // Get slug before deleting to revalidate its route
  const { data: existing } = await supabaseAdmin
    .from('blogs')
    .select('slug')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin
    .from('blogs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete blog post:', error)
    throw new Error(error.message || 'Failed to delete blog post.')
  }

  revalidatePath('/blog')
  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`)
  }
  revalidatePath('/admin')

  return { success: true }
}

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  await assertAdmin()

  const { data, error } = await supabaseAdmin
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load blog posts:', error)
    return []
  }

  return (data || []) as BlogPost[]
}

