"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function DownloadApp() {
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      if (/android/i.test(navigator.userAgent)) {
        setDownloadLink("https://play.google.com/store/apps/details?id=com.your.club1111&hl=en_US");
      } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setDownloadLink("https://apps.apple.com/us/app/11-11-eptx/id6739264535");
      }
    }
  }, []);

  return (
    <section
      className="relative text-white py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/hero.jpg')" }} 
    >
      <div className="relative bg-black/60 backdrop-blur-md h-[500px] rounded-tl-[50px] rounded-tr-[50px] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-full flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-16">
          
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold">Download Our App</h2>
            <p className="text-lg">
              Exclusive features, the latest events, and everything about your favorite artists.
              Create your profile and earn points with ticket purchases via the app.
            </p>

            {/* Features List */}
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

            {/* Download Button */}
            {downloadLink ? (
              <a
                href={downloadLink}
                className="inline-block px-8 py-4 bg-white text-black rounded-md hover:bg-gray-100 transition"
              >
                Download App
              </a>
            ) : (
              <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <a
                  href="https://apps.apple.com/us/app/11-11-eptx/id6739264535"
                  className="inline-block px-6 py-3 bg-white text-black rounded-md hover:bg-gray-100 transition"
                >
                  Download on App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.your.club1111&hl=en_US"
                  className="inline-block px-6 py-3 bg-white text-black rounded-md hover:bg-gray-100 transition"
                >
                  Download on Google Play
                </a>
              </div>
            )}
          </div>
          
          {/* Right Image */}
          <div className="relative">
            <Image
              src="/phone-mockup.png"
              alt="Phone Mockup"
              width={400}
              height={800}
              className="absolute lg:-top-28 -top-20 lg:-right-12"
            />
          </div>
        </div>
      </div>
    </section>
  );
}