import { Card, CardContent, CardHeader } from "../../components/ui/card";
import {
  Sparkles,
  Crosshair,
  History
} from "lucide-react";
import { VideoPlayer } from "../../core/video-manager";

const features = [
  {
    icon: Sparkles,
    title: "Create Stunning Visuals",
    description:
      "Effortlessly generate high-quality, professional-grade images. Powered by Nano Banana.",
    videoSettings: {
      src: "/public/assets/videos/short-cap-full-tut-music.mp4",
      startTime: 0,
      endTime: 3,
      loop: true,
      autoPlay: true,
      muted: true,
      playsInline: true,
      className: "object-cover rounded-tl-xl w-full h-full scale-[1.6]",
      responsivePosition: {
        xs: { x: 0, y: 0 }, // Mobile: centered
        sm: { x: 0, y: 0 }, // Tablet: centered
        md: { x: 0, y: 0 }, // Desktop: centered (equivalent to 50% center)
        lg: { x: 0, y: 0 }, // Large screens: centered
        xl: { x: 0, y: 0 } // Extra large: centered
      }
    }
  },
  {
    icon: Crosshair,
    title: "Precision Image Editing",
    description:
      "Edit images seamlessly with advanced precision tools. Perfect for inpainting and detailed adjustments.",
    videoSettings: {
      src: "/public/assets/videos/short-cap-full-tut-music.mp4",
      startTime: 5.5,
      endTime: 15,
      loop: true,
      autoPlay: true,
      muted: true,
      playsInline: true,
      className: "object-cover rounded-tl-xl w-full h-full scale-[2]",
      responsivePosition: {
        xs: { x: 0.15, y: 0.1 }, // Mobile: slightly right, top
        sm: { x: 0.20, y: 0.05 }, // Tablet: more centered
        md: { x: 0.23, y: 0 }, // Desktop: far left, center
        lg: { x: 0.25, y: -0.05 }, // Large screens: further left
        xl: { x: 0.28, y: -0.1 } // Extra large: most left
      }
    }
  },
  {
    icon: History,
    title: "Manage Your Image History",
    description:
      "Easily track, undo, and redo changes. Stay in control of your creative process at all times.",
    videoSettings: {
      src: "/public/assets/videos/cap-undo-redo-fast.mp4",
      startTime: 0,
      endTime: 6,
      loop: true,
      autoPlay: true,
      muted: true,
      playsInline: true,
      className: "object-cover rounded-tl-xl w-full h-full scale-[2]",
      responsivePosition: {
        xs: { x: 0.8, y: 1.2 }, // Mobile: slightly left, top
        sm: { x: 0.85, y: 1.3 }, // Tablet: more centered
        md: { x: 5, y: 1.4 }, // Desktop: center-right
        lg: { x: 1, y: 1.5 }, // Large screens: right, bottom
        xl: { x: 1.1, y: 1.6 } // Extra large: most right, bottom
      }
    }
  },
  // {
  //   icon: Users,
  //   title: "Engage with Your Audience",
  //   description:
  //     "Boost audience engagement with interactive features like polls, quizzes, and forms.",
  // },
  // {
  //   icon: FolderSync,
  //   title: "Automate Your Workflow",
  //   description:
  //     "Streamline your processes by automating repetitive tasks, saving time and reducing effort.",
  // },
  // {
  //   icon: Zap,
  //   title: "Accelerate Growth",
  //   description:
  //     "Supercharge your growth by implementing strategies that drive results quickly and efficiently.",
  // },
];

const Features = () => {
  return (
    <div
      id="features"
      className="max-w-screen-xl mx-auto w-full py-12 xs:py-20 px-6"
    >
      <h2 className="text-3xl xs:text-4xl md:text-5xl md:leading-[3.5rem] font-bold tracking-tight sm:max-w-xl sm:text-center sm:mx-auto">
        What we offer
      </h2>
      <div className="mt-8 xs:mt-14 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="flex flex-col border rounded-xl overflow-hidden shadow-none"
          >
            <CardHeader>
              <feature.icon />
              <h4 className="!mt-3 text-xl font-bold tracking-tight">
                {feature.title}
              </h4>
              <p className="mt-1 text-muted-foreground text-sm xs:text-[17px]">
                {feature.description}
              </p>
            </CardHeader>
            <CardContent className="mt-auto px-0 pb-0">
              <div className="h-52 ml-6 rounded-tl-xl overflow-hidden bg-muted">
                {feature.videoSettings && (
                  <VideoPlayer settings={feature.videoSettings} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;
