import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="h-[380px] w-[380px] max-w-full" aria-hidden>
          <img
            src="/images/broken-pot.png"
            alt="Broken pot illustration"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-4 text-center text-black">
          <h1 className="text-3xl font-semibold leading-[1.69] tracking-[-6.14%]">
            Page Not Found
          </h1>
          <p className="text-lg leading-[2] max-w-[600px]">
            Looks like the page you were searching for has wandered off the map.
            Let&apos;s guide you back to the marketplace so you can keep exploring
            the latest token launches.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-[#DD3345] px-8 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-[#C02A3A]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
