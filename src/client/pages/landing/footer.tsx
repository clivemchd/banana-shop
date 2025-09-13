import { Separator } from "../../components/ui/separator";
import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";

const footerSections = [
  {
    title: "Product",
    links: [
      {
        title: "Overview",
        href: "#",
      },
      {
        title: "Features",
        href: "#",
      },
      {
        title: "Solutions",
        href: "#",
      },
      {
        title: "Tutorials",
        href: "#",
      },
      {
        title: "Pricing",
        href: "#",
      },
      {
        title: "Releases",
        href: "#",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        title: "About us",
        href: "#",
      },
      {
        title: "Careers",
        href: "#",
      },
      {
        title: "Press",
        href: "#",
      },
      {
        title: "News",
        href: "#",
      },
      {
        title: "Media kit",
        href: "#",
      },
      {
        title: "Contact",
        href: "#",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        title: "Blog",
        href: "#",
      },
      {
        title: "Newsletter",
        href: "#",
      },
      {
        title: "Events",
        href: "#",
      },
      {
        title: "Help centre",
        href: "#",
      },
      {
        title: "Tutorials",
        href: "#",
      },
      {
        title: "Support",
        href: "#",
      },
    ],
  },
  {
    title: "Social",
    links: [
      {
        title: "Twitter",
        href: "#",
      },
      {
        title: "LinkedIn",
        href: "#",
      },
      {
        title: "Facebook",
        href: "#",
      },
      {
        title: "GitHub",
        href: "#",
      },
      {
        title: "AngelList",
        href: "#",
      },
      {
        title: "Dribbble",
        href: "#",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        title: "Terms",
        href: "#",
      },
      {
        title: "Privacy",
        href: "#",
      },
      {
        title: "Cookies",
        href: "#",
      },
      {
        title: "Licenses",
        href: "#",
      },
      {
        title: "Settings",
        href: "#",
      },
      {
        title: "Contact",
        href: "#",
      },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="mt-12 xs:mt-20 dark bg-background border-t">
      <div className="max-w-screen-xl mx-auto py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-8 gap-y-10 px-6">
        <div className="col-span-full xl:col-span-2">
          {/* Logo */}
          <svg
            id="logo-7"
            width="124"
            height="32"
            viewBox="0 0 124 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M36.87 10.07H39.87V22.2H36.87V10.07ZM41.06 17.62C41.06 14.62 42.9 12.83 45.74 12.83C48.58 12.83 50.42 14.62 50.42 17.62C50.42 20.62 48.62 22.42 45.74 22.42C42.86 22.42 41.06 20.67 41.06 17.62ZM47.41 17.62C47.41 15.97 46.76 15 45.74 15C44.72 15 44.08 16 44.08 17.62C44.08 19.24 44.71 20.22 45.74 20.22C46.77 20.22 47.41 19.3 47.41 17.63V17.62Z"
              className="fill-foreground"
            />
            <path
              d="M28.48 10.62C27.9711 9.45636 27.2976 8.37193 26.48 7.4C25.2715 5.92034 23.7633 4.71339 22.0547 3.8586C20.3461 3.00382 18.4758 2.52057 16.567 2.44066C14.6582 2.36075 12.7541 2.68599 10.98 3.39499C9.20597 4.10398 7.60217 5.18065 6.2742 6.55413C4.94622 7.9276 3.92417 9.56675 3.27532 11.3637C2.62647 13.1606 2.36552 15.0746 2.50966 16.9796C2.65381 18.8847 3.19976 20.7261 4.11246 22.4049C5.02516 24.0837 6.28217 25.5597 7.79398 26.7397C9.30579 27.9197 11.0351 28.7755 12.8726 29.2493C14.7101 29.7232 16.6152 29.8048 18.4846 29.4887C20.354 29.1726 22.1416 28.4672 23.7284 27.4195C25.3152 26.3717 26.6643 25.0063 27.6878 23.4122C28.7114 21.8181 29.3856 20.0316 29.6648 18.1751C29.944 16.3186 29.8218 14.4307 29.3069 12.6185"
              className="fill-foreground"
            />
          </svg>

          <p className="mt-4 text-muted-foreground">
            Design amazing digital experiences that create more happy in the
            world.
          </p>
        </div>

        {footerSections.map(({ title, links }) => (
          <div key={title} className="xl:justify-self-end">
            <h6 className="font-semibold text-foreground">{title}</h6>
            <ul className="mt-6 space-y-4">
              {links.map(({ title, href }) => (
                <li key={title}>
                  <a
                    href={href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Separator />
      <div className="max-w-screen-xl mx-auto py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6">
        {/* Copyright */}
        <span className="text-muted-foreground text-center xs:text-start">
          &copy; {new Date().getFullYear()}{" "}
          <a href="https://shadcnui-blocks.com" target="_blank">
            Shadcn UI Blocks
          </a>
          . All rights reserved.
        </span>

        <div className="flex items-center gap-5 text-muted-foreground">
          <a href="#" target="_blank">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" target="_blank">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" target="_blank">
            <Linkedin className="h-5 w-5" />
          </a>
          <a href="#" target="_blank">
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
