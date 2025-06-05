import { createFileRoute } from "@tanstack/react-router";
import { TokenCard } from "../components/TokenCard";
import { ExternalLink } from "lucide-react";


export const Route = createFileRoute("/")({
    component: Token,
});

const tokens = [
    {
        image: "/curate.png",
        avatar: "/curate.png",
        name: "CURATEDDOTFUN",
        symbol: "CURATE",
        type: "Meme Coin",
        description:
        "Lorem ipsum dolor sit amet consectetur. Facilisis sit tellus ultrices vitae. Sit ac tellus posuere dolor pulvinar interdum pharetra fermentum commodo. Aliquam vitae lectus fringilla...",
        progress: 60,
        progressLabel: "123/100B",
        address: "7xH5.....9Gh3",
        createdOn: "Apr 15, 2025",
        marketCap: "1,000,000,000",
        price: "1,000,000,000",
        externalLabel: "View on Raydium",
        externalIcon: <ExternalLink className="w-4 h-4" />,
    },
    {
        image: "/curate.png",
        avatar: "/curate.png",
        name: "CURATEDDOTFUN",
        symbol: "CURATE",
        type: "Meme Coin",
        description:
        "Lorem ipsum dolor sit amet consectetur. Facilisis sit tellus ultrices vitae. Sit ac tellus posuere dolor pulvinar interdum pharetra fermentum commodo. Aliquam vitae lectus fringilla...",
        progress: 60,
        progressLabel: "123/100B",
        address: "7xH5.....9Gh3",
        createdOn: "Apr 15, 2025",
        marketCap: "1,000,000,000",
        price: "1,000,000,000",
        externalLabel: "View on Jupiter",
        externalIcon: <ExternalLink className="w-4 h-4" />,
    },
    {
        image: "/curate.png",
        avatar: "/curate.png",
        name: "CURATEDDOTFUN",
        symbol: "CURATE",
        type: "Meme Coin",
        description:
        "Lorem ipsum dolor sit amet consectetur. Facilisis sit tellus ultrices vitae. Sit ac tellus posuere dolor pulvinar interdum pharetra fermentum commodo. Aliquam vitae lectus fringilla...",
        progress: 60,
        progressLabel: "123/100B",
        address: "7xH5.....9Gh3",
        createdOn: "Apr 15, 2025",
        marketCap: "1,000,000,000",
        price: "1,000,000,000",
        externalLabel: "View on Orca",
        externalIcon: <ExternalLink className="w-4 h-4" />,
    }
];

function Token() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-2">My Tokens</h1>
        <p className="text-gray-500 mb-8 text-base">
          View and manage all the tokens you've created on the token launch platforms
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tokens.map((token, idx) => (
            <TokenCard
              key={idx}
              {...token}
            />
          ))}
        </div>
      </div>
    </div>
  );
}