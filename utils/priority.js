/**
 * Calculate priority score for an issue
 * 
 * Priority Algorithm:
 * - 5 points from user's own importance rating (0-5)
 * - 5 points from repost count (normalized to 0-5 scale)
 * - Total priority: 0-10 (can be normalized to 0-5 if needed)
 * 
 * @param {number} importanceRating - User's rating (0-5)
 * @param {number} repostCount - Number of times issue was reposted
 * @param {number} maxReposts - Maximum reposts to normalize against (default: 100)
 * @returns {Object} Priority score and breakdown
 */
export function calculatePriority(importanceRating, repostCount = 0, maxReposts = 100) {
  // User's own rating points (0-5)
  const userRatingPoints = Math.min(importanceRating, 5);
  
  // Repost points (0-5) - normalized based on max reposts
  // Formula: (repostCount / maxReposts) * 5, capped at 5
  const repostPoints = Math.min((repostCount / maxReposts) * 5, 5);
  
  // Total priority score (0-10)
  const totalPriority = userRatingPoints + repostPoints;
  
  // Normalized priority (0-5 scale) for display
  const normalizedPriority = totalPriority / 2;
  
  return {
    totalPriority: Math.round(totalPriority * 100) / 100, // Round to 2 decimal places
    normalizedPriority: Math.round(normalizedPriority * 100) / 100, // 0-5 scale
    userRatingPoints: Math.round(userRatingPoints * 100) / 100,
    repostPoints: Math.round(repostPoints * 100) / 100,
    repostCount,
    importanceRating,
  };
}

/**
 * Get max repost count from all issues (for normalization)
 */
export async function getMaxRepostCount(prisma) {
  const result = await prisma.repost.groupBy({
    by: ['issueId'],
    _count: {
      issueId: true,
    },
    orderBy: {
      _count: {
        issueId: 'desc',
      },
    },
    take: 1,
  });

  return result.length > 0 ? result[0]._count.issueId : 1;
}

