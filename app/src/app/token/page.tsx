import { getTokens } from "@/lib/api";
import TokenSearch from "@/components/token/TokenSearch";

export default async function TokenPage() {
  const tokensResponse = await getTokens();
  const tokens = tokensResponse.data || [];

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
        <p className="text-gray-500 mb-8 text-base">
          Discover and participate in token launches. Support projects you believe in.
        </p>
        
        <TokenSearch initialTokens={tokens} />
      </div>
    </div>
  );
}