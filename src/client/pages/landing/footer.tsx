import { Separator } from "../../components/ui/separator";
import Logo from "../../core/logo/logo";
import { Link } from "react-router-dom";

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
        href: "/cookie-policy",
      }
    ],
  },
];

const Footer = () => {
  return (
    <footer className="mt-12 xs:mt-20 dark bg-background border-t">
      <div className="max-w-screen-xl mx-auto py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-8 gap-y-10 px-6">
        <div className="col-span-full xl:col-span-2">
          {/* Logo */}
          <Logo />
        </div>

        {/* Legal section - now visible */}
        <div className="xl:justify-self-end">
          <h6 className="font-semibold text-foreground">Legal</h6>
          <ul className="mt-6 space-y-4">
            {footerSections.find(s => s.title === "Legal")?.links.map(({ title, href }) => (
              <li key={title}>
                {href.startsWith('/') ? (
                  <Link
                    to={href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {title}
                  </Link>
                ) : (
                  <a
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {title}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Uncomment other sections as needed */}
        {/* {footerSections.filter(s => s.title !== "Legal").map(({ title, links }) => (
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
        ))} */}
      </div>
      {/* <Separator /> */}
      {/* <div className="max-w-screen-xl mx-auto py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6">
        <span className="text-muted-foreground text-center xs:text-start">
          &copy; {new Date().getFullYear()}{" "}
          <a href="#" target="_blank">
            NanoStudio
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
      </div> */}
    </footer>
  );
};

export default Footer;
