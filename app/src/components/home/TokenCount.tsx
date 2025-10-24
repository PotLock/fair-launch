import { getTokens } from '@/lib/api';

export default async function TokenCount() {
  try {
    const tokensData = await getTokens();
    const tokenCount = tokensData?.data?.length || 0;
    
    return (
      <span className="font-bold text-4xl">{tokenCount}</span>
    );
  } catch (error) {
    console.error('Error fetching token count:', error);
    // Fallback to 0 if there's an error
    return (
      <span className="font-bold text-4xl">0</span>
    );
  }
}
