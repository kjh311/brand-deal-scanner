import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BlogMarkdown } from '@/components/blog/BlogMarkdown'
import { ArrowLeft, Calendar, ShieldCheck, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

type Props = {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blogs')
    .select('title, excerpt, created_at')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!post) {
    return {
      title: 'Article Not Found | Brand Deal Fixer',
      description: 'The requested article could not be found.',
    }
  }

  const title = `${post.title} | Brand Deal Fixer`
  const description =
    post.excerpt || `Read "${post.title}" on Brand Deal Fixer — AI Contract Auditor for Creators.`

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.created_at,
      url: `https://www.branddealfixer.com/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!post) {
    notFound()
  }

  const blog = post as BlogPost

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full border border-white/15 backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Articles</span>
            </Link>
          </div>

          {/* Article Container */}
          <article className="bg-white border border-[#E2E8F0] rounded-[2.5rem] p-8 sm:p-12 md:p-16 text-[#1E1A5F] shadow-2xl">
            {/* Header info */}
            <header className="mb-10 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#64748B] uppercase tracking-wider mb-4">
                <Calendar className="w-4 h-4 text-[#7B2CBF]" />
                <time dateTime={blog.created_at}>
                  {new Date(blog.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
                <span>•</span>
                <span>Brand Deal Fixer Editorial</span>
              </div>

              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E1A5F] mb-6 leading-[1.15]">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="text-lg sm:text-xl text-[#475569] leading-relaxed font-normal bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  {blog.excerpt}
                </p>
              )}
            </header>

            {/* Markdown Body */}
            <div className="text-base sm:text-lg">
              <BlogMarkdown text={blog.body} />
            </div>

            {/* Bottom Conversion CTA */}
            <div className="mt-16 pt-10 border-t border-slate-200">
              <div className="bg-gradient-to-br from-[#1E1A5F] to-[#3B1D8B] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit Your Contract</span>
                  </div>
                  <h3 className="font-headline text-2xl font-bold">
                    Never sign away your rights blindly.
                  </h3>
                  <p className="text-white/80 text-sm max-w-md">
                    Upload your contract to scan for perpetual rights, exclusivity traps, and missing indemnity protection in 60 seconds.
                  </p>
                </div>
                <Link
                  href="/upload"
                  className="px-6 py-3.5 rounded-xl bg-white text-[#1E1A5F] hover:bg-slate-100 font-bold text-sm tracking-wide transition-all shadow-lg shrink-0 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>Upload Contract</span>
                  <ArrowRight className="w-4 h-4 text-[#7B2CBF]" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

