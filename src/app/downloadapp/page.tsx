// File: components/DownloadApp.tsx
"use client";

export default function DownloadApp() {
  return (
    <section className="relative bg-black text-white py-16">
      <div className="relative bg-black bg-opacity-50 backdrop-blur-md h-[500px] rounded-tl-[50px] rounded-tr-[50px] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-full flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-16">
          <div className="text-center lg:text-left space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold">Download Our App</h2>
            <p className="text-lg">
              Exclusive features, the latest events, and everything about your favorite artists.
              Create your profile and earn points with ticket purchases via the app.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  🔔
                </div>
                <span>Notifications</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  🎁
                </div>
                <span>Rewards</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  🎵
                </div>
                <span>Mixtapes</span>
              </div>
            </div>
            <a
              href="#"
              className="inline-block px-8 py-4 bg-white text-black rounded-md hover:bg-gray-100 transition"
            >
              Download App
            </a>
          </div>
          <div className="relative">
            <img
              src="/phone-mockup.png"
              alt="Phone Mockup"
              className="w-[300px] lg:w-[400px] h-auto absolute lg:-top-28 -top-20 lg:-right-12"
            />
          </div>
        </div>
      </div>
    </section>
  );
}