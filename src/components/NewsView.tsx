'use client';

import { useState, useEffect } from 'react';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  url: string;
  imageUrl?: string;
}

export default function NewsView() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/news');
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await res.json();
      setNews(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text: string, lines: number = 2) => {
    const words = text.split(' ');
    const wordsPerLine = 15;
    const maxWords = lines * wordsPerLine;
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-emerald-500 mb-4"></div>
        <p className="text-gray-400 text-sm">Loading market news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Unable to load news</h3>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button
          onClick={fetchNews}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show full article view
  if (selectedArticle) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Fixed Back Button */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-xl py-3 border-b border-gray-800">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to News</span>
          </button>
        </div>

        {/* Scrollable Article Content */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <article className="max-w-3xl mx-auto">
            {/* Article Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                {selectedArticle.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  {selectedArticle.source}
                </span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(selectedArticle.publishedAt)}
                </span>
              </div>
            </div>

            {/* Article Image */}
            {selectedArticle.imageUrl && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-invert prose-emerald max-w-none">
              <div className="text-gray-300 leading-relaxed text-base sm:text-lg">
                {selectedArticle.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Read Original Article - Always visible for full article on source */}
            {selectedArticle.url && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-gray-500 text-sm mb-3">
                  Want to read more? Visit the original source for the complete article.
                </p>
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-emerald-500/20"
                >
                  <span>Read Original Article on {selectedArticle.source}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </article>
        </div>
      </div>
    );
  }

  // News list view
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Market News</h2>
          <p className="text-gray-400 text-sm mt-1">Latest stock market updates from India</p>
        </div>
        <button
          onClick={fetchNews}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all group"
          title="Refresh news"
        >
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:rotate-180 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No news available</h3>
          <p className="text-gray-500 text-sm">Check back later for market updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((article) => (
            <div
              key={article.id}
              className="bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                {article.imageUrl && (
                  <div className="sm:w-48 sm:min-w-[12rem] h-32 sm:h-auto overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 p-4 sm:p-5">
                  {/* Clickable Title */}
                  <h3
                    onClick={() => setSelectedArticle(article)}
                    className="text-base sm:text-lg font-semibold text-white mb-2 cursor-pointer hover:text-emerald-400 transition-colors line-clamp-2"
                  >
                    {article.title}
                  </h3>
                  
                  {/* Preview Text */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                    {truncateText(article.content, 2)}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="bg-gray-800 px-2 py-1 rounded-lg">{article.source}</span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      Read more
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
