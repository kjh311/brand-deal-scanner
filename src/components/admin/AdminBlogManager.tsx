'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Check, Loader2, Trash2, ExternalLink, FileText, PlusCircle } from 'lucide-react'
import { publishBlogPost, deleteBlogPost } from '@/app/actions/blog'
import { slugify, type BlogPost } from '@/lib/blog'

interface AdminBlogManagerProps {
  initialPosts: BlogPost[]
}

export function AdminBlogManager({ initialPosts }: AdminBlogManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugEdited, setIsSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug when title changes unless admin manually modified it
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!isSlugEdited) {
      setSlug(slugify(val))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugEdited(true)
    setSlug(slugify(e.target.value))
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a blog title.')
      return
    }
    if (!body.trim()) {
      setError('Please provide the blog post body content.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await publishBlogPost({
        title,
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        body,
        published: true,
      })

      setSuccess(`Blog post "${res.post.title}" published successfully!`)
      // Add to local list at the top
      setPosts((prev) => [res.post, ...prev.filter((p) => p.id !== res.post.id)])

      // Reset form
      setTitle('')
      setSlug('')
      setIsSlugEdited(false)
      setExcerpt('')
      setBody('')
    } catch (err) {
      console.error('Publishing error:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish post.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${post.title}"?`)) {
      return
    }

    setDeletingId(post.id)
    setError(null)
    setSuccess(null)

    try {
      await deleteBlogPost(post.id)
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      setSuccess(`Deleted "${post.title}".`)
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete blog post.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[2.5rem] overflow-hidden text-[#1E1A5F] shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7B2CBF] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-headline text-2xl font-bold tracking-tight block">
              Manage Blog Posts
            </span>
            <span className="text-xs text-[#64748B]">
              {posts.length} {posts.length === 1 ? 'article' : 'articles'} published
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#64748B]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#64748B]" />
        )}
      </button>

      {isOpen && (
        <div ref={contentRef} className="px-6 md:px-8 pb-8 md:pb-12 pt-2 border-t border-slate-100">
          <p className="text-sm text-[#64748B] mb-6">
            Author and publish SEO-optimized articles directly to your public blog at <Link href="/blog" target="_blank" className="text-[#7B2CBF] font-semibold underline">/blog</Link>.
          </p>

          {/* Feedback alerts */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          {/* New Post Form */}
          <form onSubmit={handlePublish} className="space-y-5 bg-slate-50/70 border border-slate-200 p-6 rounded-2xl mb-10">
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-[#7B2CBF]" />
              <h3 className="font-headline text-lg font-bold text-[#1E1A5F]">Create New Article</h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                Blog Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. How to Negotiate Brand Deal Usage Rights in 2026"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-[#1E1A5F] focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  URL Slug (Auto-generated)
                </label>
                {isSlugEdited && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlugEdited(false)
                      setSlug(slugify(title))
                    }}
                    className="text-[11px] text-[#7B2CBF] hover:underline"
                  >
                    Reset to auto
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden text-sm">
                <span className="px-3 py-3 bg-slate-100 text-[#64748B] text-xs font-mono border-r border-slate-300 select-none">
                  /blog/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="how-to-negotiate-usage-rights"
                  className="w-full px-3 py-3 bg-transparent text-[#1E1A5F] font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                Excerpt / Meta Description (Optional)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="Short 1-2 sentence summary for Google search previews and article preview cards..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-[#1E1A5F] focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] text-sm resize-y"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Body Content (Markdown Supported) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B]">
                  Use <code className="text-[#D84C9F]"># Heading</code>, <code className="text-[#D84C9F]">**bold**</code>, <code className="text-[#D84C9F]">- bullet</code>, <code className="text-[#D84C9F]">&gt; quote</code>
                </span>
              </div>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                placeholder="Write your article in Markdown...

# Introduction
Explain the topic clearly here...

## Key Clauses to Check
- Exclusivity duration
- Perpetual licensing
- Late payment penalties

> Always negotiate perpetuity down to 12 months maximum."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-[#1E1A5F] font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] leading-relaxed resize-y"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#221A7F] to-[#7B2CBF] text-white font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Blog Post</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* List of Published Articles */}
          <div className="pt-2">
            <h3 className="font-headline text-lg font-bold text-[#1E1A5F] mb-4 flex items-center justify-between">
              <span>Existing Articles ({posts.length})</span>
              <Link
                href="/blog"
                target="_blank"
                className="text-xs text-[#7B2CBF] font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Public Blog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </h3>

            {posts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl text-[#64748B] text-sm">
                No blog posts published yet. Use the form above to publish your first article!
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="font-bold text-[#1E1A5F] hover:text-[#7B2CBF] text-sm md:text-base truncate transition-colors"
                        >
                          {post.title}
                        </Link>
                        {post.published ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#64748B]">
                        <span className="font-mono text-[11px] text-slate-500 truncate">
                          /blog/{post.slug}
                        </span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#1E1A5F] hover:bg-slate-50 transition-colors flex items-center gap-1 font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3 text-[#64748B]" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        disabled={deletingId === post.id}
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
                        title="Delete article"
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

