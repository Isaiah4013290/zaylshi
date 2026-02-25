export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="font-syne text-2xl font-bold mb-2">Request Sent!</h1>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Your request is pending approval. Check back soon!
        </p>
      </div>
    </div>
  )
}
