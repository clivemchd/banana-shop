import Logo from "../../core/logo/logo";
import { Link } from "react-router-dom";

// X (formerly Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type FooterLink = {
  title: string;
  href: string;
  status?: 'COMING_SOON';
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      {
        title: "Overview",
        href: "#",
      },
      {
        title: "Features",
        href: "#features",
      },
      {
        title: "Pricing",
        href: "#pricing",
      }
    ],
  },
  {
    title: "Company",
    links: [
      {
        title: "Contact",
        href: "/contact",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        title: "Blog",
        href: "#",
        status: 'COMING_SOON'
      },
      {
        title: "Newsletter",
        href: "#",
        status: 'COMING_SOON'
      }
    ],
  },
  {
    title: "Legal",
    links: [
      {
        title: "Terms",
        href: "/terms",
      },
      {
        title: "Privacy",
        href: "/privacy-policy",
      },
      {
        title: "Cookies",
        href: "/cookie-policy",
      }
    ],
  },
];

const Footer = () => {
  const handleSectionClick = (href: string) => {
    // Check if it's a hash link (section on landing page)
    if (href.startsWith('#')) {
      const sectionId = href.substring(1); // Remove the '#'
      
      // Handle empty hash (like "#") - navigate to home page top
      if (!sectionId || sectionId.trim() === '') {
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      
      // If we're not on the home page, navigate to home first
      if (window.location.pathname !== '/') {
        // Navigate to home with hash, then scroll after a brief delay
        window.location.href = `/${href}`;
        // The scrolling will be handled by the landing page useEffect
      } else {
        // If we're on the home page, update the hash and scroll to the section
        window.history.pushState(null, '', href);
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleInternalLinkClick = () => {
    // Scroll to top when clicking internal route links
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            {footerSections.find(s => s.title === "Legal")?.links.map(({ title, href, status }) => (
              <li key={title}>
                {href.startsWith('/') ? (
                  <Link
                    to={href}
                    onClick={handleInternalLinkClick}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                  >
                    {title}
                    {status === 'COMING_SOON' && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        Soon
                      </span>
                    )}
                  </Link>
                ) : (
                  <a
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                  >
                    {title}
                    {status === 'COMING_SOON' && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        Soon
                      </span>
                    )}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Uncomment other sections as needed */}
        {footerSections.filter(s => s.title !== "Legal").map(({ title, links }) => (
          <div key={title} className="xl:justify-self-end">
            <h6 className="font-semibold text-foreground">{title}</h6>
            <ul className="mt-6 space-y-4">
              {links.map(({ title, href, status }) => (
                <li key={title}>
                  {href.startsWith('/') ? (
                    <Link
                      to={href}
                      onClick={handleInternalLinkClick}
                      className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                    >
                      {title}
                      {status === 'COMING_SOON' && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          Soon
                        </span>
                      )}
                    </Link>
                  ) : href.startsWith('#') ? (
                    <button
                      onClick={() => handleSectionClick(href)}
                      className="text-muted-foreground hover:text-foreground transition-colors text-left inline-flex items-center gap-2"
                    >
                      {title}
                      {status === 'COMING_SOON' && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          Soon
                        </span>
                      )}
                    </button>
                  ) : (
                    <a
                      href={href}
                      className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                    >
                      {title}
                      {status === 'COMING_SOON' && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                          Soon
                        </span>
                      )}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* <Separator /> */}
      <div className="max-w-screen-xl mx-auto py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6">
        <span className="text-muted-foreground text-center xs:text-start">
          &copy; {new Date().getFullYear()}{" "}
          <a href="#" target="_blank">
            NanoStudio
          </a>
          . All rights reserved.
        </span>

        <div className="flex items-center gap-5 text-muted-foreground">
          <a href="https://x.com/MoneOunchPan" target="_blank">
            <XIcon className="h-5 w-5" />
          </a>
          {/* <a href="#" target="_blank">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" target="_blank">
            <Linkedin className="h-5 w-5" />
          </a>
          <a href="#" target="_blank">
            <Github className="h-5 w-5" />
          </a> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
