import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { UploadContractButton } from '@/components/ui/UploadContractButton'
import { ArrowRight, Calendar, BookOpen } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog & Creator Contract Guides | Brand Deal Fixer',
  description:
    'Expert contract breakdowns, red flag checklists, and sponsorship negotiation playbooks to protect your creator business.',
  openGraph: {
    title: 'Brand Deal Fixer Blog',
    description:
      'Expert contract breakdowns, red flag checklists, and sponsorship negotiation playbooks for creators and agencies.',
    type: 'website',
  },
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function BlogIndexPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, created_at, published')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch blog posts:', error)
  }

  const posts = (data || []) as BlogPost[]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 md:px-10">
        <div className="max-w-[1120px] mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono font-bold tracking-widest uppercase mb-4 text-white">
              <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
              <span>Creator Contract Intelligence</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-white">
              The Brand Deal <span className="text-[#00F5FF]">Blog</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              Negotiation playbooks, contract clause red flags, and deal insights to help creators and agencies protect their rights and maximize earnings.
            </p>
          </div>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-xl border border-white/15 rounded-[2.5rem] p-12 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-headline text-2xl font-bold mb-2 text-white">Articles Coming Soon</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Our legal and AI deal analysts are drafting comprehensive contract teardowns and creator guides. Check back soon!
              </p>
              <UploadContractButton
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1E1A5F] font-bold text-sm tracking-wide hover:bg-white/90 transition-all shadow-lg cursor-pointer"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Audit a Contract Now
              </UploadContractButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-[#E2E8F0] rounded-[2rem] p-7 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-[#1E1A5F] group"
                >
                  <div>
                    {/* Meta info */}
                    <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-3">
                      <Calendar className="w-3.5 h-3.5 text-[#7B2CBF]" />
                      <time dateTime={post.created_at}>
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>

                    {/* Title */}
                    <h2 className="font-headline text-xl font-bold tracking-tight mb-3 group-hover:text-[#7B2CBF] transition-colors leading-snug">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-[#475569] leading-relaxed line-clamp-3 mb-6">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Read Article Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7B2CBF] group-hover:text-[#D84C9F] transition-colors"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

