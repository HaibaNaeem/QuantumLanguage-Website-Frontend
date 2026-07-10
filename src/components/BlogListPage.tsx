import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, ArrowRight, ArrowUpDown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogs } from '../data/blogs';

export const BlogListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [isSearching, setIsSearching] = useState(false);

  // Dynamic Categories list
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(blogs.map((b) => b.category)))];
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...blogs];

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((post) => post.category === selectedCategory);
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  // Simulate skeleton loading on search/filter changes for rich visual feel
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, sortBy]);

  // Document Title for SEO
  useEffect(() => {
    document.title = 'Quantum Logics Blog — Insights from the Creators';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white dark:bg-black text-black dark:text-white pt-32 pb-24 transition-colors duration-300 relative overflow-hidden"
    >
      {/* Background Cyber Grids & Glows */}
      <div className="absolute inset-0 cyber-grid-light dark:cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-6"
          >
            <Sparkles className="w-3 h-3" /> The Quantum Lab
          </motion.span>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tighter text-black dark:text-white uppercase mb-6"
          >
            Insights & Engineering
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-black/50 dark:text-white/50 text-lg md:text-xl leading-relaxed"
          >
            Deep dives into language internals, benchmarking, developer tools, and tutorials from the Quantum Logics core team.
          </motion.p>
        </div>

        {/* Toolbar: Search, Filter Tabs & Sort */}
        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 rounded-[28px] p-6 mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between shadow-sm backdrop-blur-md">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
            <input
              type="text"
              placeholder="Search articles, tags, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-black/50 border border-black/5 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50 dark:focus:border-cyan-500/50 transition-colors shadow-inner"
              aria-label="Search articles"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide outline-none cursor-pointer hover:border-cyan-500/30 transition-colors"
              aria-label="Sort order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Blog Grid Content */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            // Skeleton Loader Grid
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-[28px] p-6 flex flex-col justify-between h-[450px] animate-pulse">
                  <div>
                    <div className="aspect-[16/10] bg-black/5 dark:bg-white/5 rounded-2xl mb-6" />
                    <div className="h-4 bg-black/10 dark:bg-white/10 w-1/3 rounded-full mb-4" />
                    <div className="h-6 bg-black/10 dark:bg-white/10 w-3/4 rounded-full mb-3" />
                    <div className="h-4 bg-black/10 dark:bg-white/10 w-full rounded-full mb-2" />
                    <div className="h-4 bg-black/10 dark:bg-white/10 w-5/6 rounded-full" />
                  </div>
                  <div className="h-4 bg-black/10 dark:bg-white/10 w-1/4 rounded-full" />
                </div>
              ))}
            </motion.div>
          ) : filteredAndSortedPosts.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredAndSortedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group block h-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-2 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover image */}
                    <div className="aspect-[16/10] bg-black/5 dark:bg-white/5 rounded-2xl mb-6 overflow-hidden border border-black/5 dark:border-white/5 relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Metadata & badges */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border border-black/5 dark:border-white/10">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-black/30 dark:text-white/30 font-semibold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readingTime}</span>
                      </div>
                    </div>

                    <div className="text-xs text-black/40 dark:text-white/40 font-bold uppercase tracking-widest mb-3">
                      {post.date}
                    </div>

                    <h2 className="text-xl font-bold text-black dark:text-white mb-3 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors duration-300 leading-tight">
                      {post.title}
                    </h2>

                    <p className="text-black/50 dark:text-white/50 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/80 dark:text-white/80 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors duration-300">
                    Read Article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            // No matches screen
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-black/[0.01] dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-[28px] p-8"
            >
              <h3 className="text-xl font-bold uppercase tracking-wider mb-2">No Articles Found</h3>
              <p className="text-black/40 dark:text-white/40 text-sm">
                We couldn't find any blog posts matching "{searchQuery}". Try refining your keywords.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
