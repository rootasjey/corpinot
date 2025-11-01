/**
 * Composable for post-related utilities and computed properties
 */
export const usePost = () => {
  /**
   * Calculate reading time from article content
   * @param article - The Tiptap JSON article object
   * @returns Reading time string (e.g., "5 min read")
   */
  const calculateReadingTime = (article?: object): string => {
    if (!article) return '1 min read'
    
    try {
      // Extract text from Tiptap JSON structure
      const text = extractTextFromTiptap(article)
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
      
      // Average reading speed: 200 words per minute
      const minutes = Math.ceil(wordCount / 200)
      
      return minutes === 1 ? '1 min read' : `${minutes} min read`
    } catch (error) {
      console.error('Error calculating reading time:', error)
      return '1 min read'
    }
  }

  /**
   * Extract plain text from Tiptap JSON structure
   * @param node - Tiptap JSON node
   * @returns Extracted text
   */
  const extractTextFromTiptap = (node: any): string => {
    if (!node) return ''
    
    let text = ''
    
    // Handle text nodes
    if (node.type === 'text' && node.text) {
      text += node.text + ' '
    }
    
    // Recursively process content array
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        text += extractTextFromTiptap(child)
      }
    }
    
    return text
  }

  /**
   * Format date to readable string
   * @param dateString - ISO date string
   * @param format - Format type ('short' | 'long' | 'numeric')
   * @returns Formatted date string
   */
  const formatPostDate = (
    dateString?: string, 
    format: 'short' | 'long' | 'numeric' = 'short'
  ): string => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
      case 'long':
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      case 'numeric':
        return date.toLocaleDateString('en-US', { 
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      default:
        return dateString
    }
  }

  /**
   * Get post excerpt from description or article content
   * @param post - Post object
   * @param maxLength - Maximum length of excerpt
   * @returns Excerpt string
   */
  const getPostExcerpt = (post: Post, maxLength = 160): string => {
    if (post.description) {
      return post.description.length > maxLength
        ? post.description.substring(0, maxLength) + '...'
        : post.description
    }
    
    // Fallback to extracting from article
    if (post.article) {
      const text = extractTextFromTiptap(post.article)
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text
    }
    
    return ''
  }

  /**
   * Get featured image source with fallback
   * @param post - Post object
   * @returns Image source URL
   */
  const getPostImage = (post: Post): string => {
    return post.image?.src || '/placeholder-image.jpg'
  }

  /**
   * Get featured image alt text
   * @param post - Post object
   * @returns Alt text for image
   */
  const getPostImageAlt = (post: Post): string => {
    return post.image?.alt || post.name || 'Post image'
  }

  /**
   * Check if post is published
   * @param post - Post object
   * @returns True if post is published
   */
  const isPublished = (post: Post): boolean => {
    return post.status === 'published' && !!post.publishedAt
  }

  /**
   * Get post tag names as array
   * @param post - Post object
   * @returns Array of tag names
   */
  const getTagNames = (post: Post): string[] => {
    return post.tags?.map((tag: ApiTag) => tag.name) || []
  }

  /**
   * Enhanced post data with computed fields
   * @param post - Post object
   * @returns Post with additional computed properties
   */
  const enhancePost = (post: Post) => {
    return {
      ...post,
      readingTime: calculateReadingTime(post.article),
      formattedDate: formatPostDate(post.publishedAt || post.createdAt),
      excerpt: getPostExcerpt(post),
      imageSrc: getPostImage(post),
      imageAlt: getPostImageAlt(post),
      tagNames: getTagNames(post),
    }
  }

  return {
    calculateReadingTime,
    extractTextFromTiptap,
    formatPostDate,
    getPostExcerpt,
    getPostImage,
    getPostImageAlt,
    isPublished,
    getTagNames,
    enhancePost,
  }
}
