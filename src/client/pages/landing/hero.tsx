import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Link } from "wasp/client/router";
import { ArrowUpRight } from "lucide-react";
import { VideoPlayer } from "../../core/video-manager";

const Hero = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden border-b border-accent">
      <div className="max-w-screen-xl w-full flex flex-col lg:flex-row mx-auto items-center justify-between gap-y-14 gap-x-10 px-6 py-12 lg:py-0">
        <div className="max-w-xl">
          <Badge className="rounded-full py-1 border-none">
            Just released v1.0.0
          </Badge>
          <h1 className="mt-6 max-w-[20ch] text-3xl xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold !leading-[1.2] tracking-tight">
            AI-Powered Image Generation & Editing Made Simple
          </h1>
          <p className="mt-6 max-w-[60ch] xs:text-lg">
            Create stunning images from text and edit them with precision using our advanced AI tools. Transform your creative vision into reality with just a few clicks.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
            <Link to="/signin">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full text-base"
              >
                Get Started <ArrowUpRight className="!h-5 !w-5" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative lg:max-w-lg xl:max-w-xl w-full bg-accent rounded-xl aspect-square overflow-hidden">
          <VideoPlayer 
            settings={{
              src: "/assets/videos/short-cap-full-tut-music.mp4",
              startTime: 13,
              endTime: 17,
              loop: true,
              autoPlay: true,
              muted: true,
              playsInline: true,
              className: "object-cover rounded-xl w-full h-full scale-125",
              style: { objectPosition: '40% center' }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
