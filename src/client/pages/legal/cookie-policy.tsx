import "../../../index.css";
import Navbar from "../landing/navbar";
import Footer from "../landing/footer";
import { Link } from "react-router-dom";

export const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Last updated: <span className="font-medium">October 04, 2025</span>
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <p className="text-foreground leading-relaxed">
                  This Cookie Policy explains how <strong>MacDev</strong> ("Company," "we," "us," and "our") 
                  uses cookies and similar technologies to recognize you when you visit our website at{' '}
                  <Link to="/" className="text-primary hover:underline">
                    https://nanostudioai.com
                  </Link>{' '}
                  ("Website"). It explains what these technologies are and why we use them, as well as your 
                  rights to control our use of them.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  In some cases we may use cookies to collect personal information, or that becomes personal 
                  information if we combine it with other information.
                </p>
              </section>

              {/* What are cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">What are cookies?</h2>
                <p className="text-foreground leading-relaxed">
                  Cookies are small data files that are placed on your computer or mobile device when you 
                  visit a website. Cookies are widely used by website owners in order to make their websites 
                  work, or to work more efficiently, as well as to provide reporting information.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  Cookies set by the website owner (in this case, MacDev) are called "first-party cookies." 
                  Cookies set by parties other than the website owner are called "third-party cookies." 
                  Third-party cookies enable third-party features or functionality to be provided on or 
                  through the website (e.g., advertising, interactive content, and analytics). The parties 
                  that set these third-party cookies can recognize your computer both when it visits the 
                  website in question and also when it visits certain other websites.
                </p>
              </section>

              {/* Why do we use cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Why do we use cookies?</h2>
                <p className="text-foreground leading-relaxed">
                  We use first- and third-party cookies for several reasons. Some cookies are required for 
                  technical reasons in order for our Website to operate, and we refer to these as "essential" 
                  or "strictly necessary" cookies. Other cookies also enable us to track and target the 
                  interests of our users to enhance the experience on our Online Properties. Third parties 
                  serve cookies through our Website for advertising, analytics, and other purposes. This is 
                  described in more detail below.
                </p>
              </section>

              {/* How can I control cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">How can I control cookies?</h2>
                <p className="text-foreground leading-relaxed">
                  You have the right to decide whether to accept or reject cookies. You can exercise your 
                  cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent 
                  Manager allows you to select which categories of cookies you accept or reject. Essential 
                  cookies cannot be rejected as they are strictly necessary to provide you with services.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  The Cookie Consent Manager can be found in the notification banner and on our Website. If 
                  you choose to reject cookies, you may still use our Website though your access to some 
                  functionality and areas of our Website may be restricted. You may also set or amend your 
                  web browser controls to accept or refuse cookies.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  The specific types of first- and third-party cookies served through our Website and the 
                  purposes they perform are described in the table below (please note that the specific 
                  cookies served may vary depending on the specific Online Properties you visit).
                </p>
              </section>

              {/* Browser controls */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">How can I control cookies on my browser?</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  As the means by which you can refuse cookies through your web browser controls vary from 
                  browser to browser, you should visit your browser's help menu for more information. The 
                  following is information about how to manage cookies on the most popular browsers:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>
                    <a 
                      href="https://support.google.com/chrome/answer/95647" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Chrome
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Internet Explorer
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Firefox
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.apple.com/en-ie/guide/safari/sfri11471/mac" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Safari
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Edge
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://help.opera.com/en/latest/web-preferences/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Opera
                    </a>
                  </li>
                </ul>
                <p className="text-foreground leading-relaxed mt-4">
                  In addition, most advertising networks offer you a way to opt out of targeted advertising. 
                  If you would like to find out more information, please visit:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4 mt-2">
                  <li>
                    <a 
                      href="http://www.aboutads.info/choices/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Digital Advertising Alliance
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://youradchoices.ca/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Digital Advertising Alliance of Canada
                    </a>
                  </li>
                  <li>
                    <a 
                      href="http://www.youronlinechoices.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      European Interactive Digital Advertising Alliance
                    </a>
                  </li>
                </ul>
              </section>

              {/* Other tracking technologies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  What about other tracking technologies, like web beacons?
                </h2>
                <p className="text-foreground leading-relaxed">
                  Cookies are not the only way to recognize or track visitors to a website. We may use other, 
                  similar technologies from time to time, like web beacons (sometimes called "tracking pixels" 
                  or "clear gifs"). These are tiny graphics files that contain a unique identifier that 
                  enables us to recognize when someone has visited our Website or opened an email including 
                  them. This allows us, for example, to monitor the traffic patterns of users from one page 
                  within a website to another, to deliver or communicate with cookies, to understand whether 
                  you have come to the website from an online advertisement displayed on a third-party 
                  website, to improve site performance, and to measure the success of email marketing 
                  campaigns. In many instances, these technologies are reliant on cookies to function 
                  properly, and so declining cookies will impair their functioning.
                </p>
              </section>

              {/* Flash cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Do you use Flash cookies or Local Shared Objects?
                </h2>
                <p className="text-foreground leading-relaxed">
                  Websites may also use so-called "Flash Cookies" (also known as Local Shared Objects or 
                  "LSOs") to, among other things, collect and store information about your use of our 
                  services, fraud prevention, and for other site operations.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  If you do not want Flash Cookies stored on your computer, you can adjust the settings of 
                  your Flash player to block Flash Cookies storage using the tools contained in the{' '}
                  <a 
                    href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website Storage Settings Panel
                  </a>
                  . You can also control Flash Cookies by going to the{' '}
                  <a 
                    href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager03.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Global Storage Settings Panel
                  </a>{' '}
                  and following the instructions (which may include instructions that explain, for example, 
                  how to delete existing Flash Cookies (referred to "information" on the Macromedia site), 
                  how to prevent Flash LSOs from being placed on your computer without your being asked, and 
                  (for Flash Player 8 and later) how to block Flash Cookies that are not being delivered by 
                  the operator of the page you are on at the time).
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies 
                  may reduce or impede the functionality of some Flash applications, including, potentially, 
                  Flash applications used in connection with our services or online content.
                </p>
              </section>

              {/* Targeted advertising */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Do you serve targeted advertising?</h2>
                <p className="text-foreground leading-relaxed">
                  Third parties may serve cookies on your computer or mobile device to serve advertising 
                  through our Website. These companies may use information about your visits to this and other 
                  websites in order to provide relevant advertisements about goods and services that you may 
                  be interested in. They may also employ technology that is used to measure the effectiveness 
                  of advertisements. They can accomplish this by using cookies or web beacons to collect 
                  information about your visits to this and other sites in order to provide relevant 
                  advertisements about goods and services of potential interest to you. The information 
                  collected through this process does not enable us or them to identify your name, contact 
                  details, or other details that directly identify you unless you choose to provide these.
                </p>
              </section>

              {/* Updates */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">How often will you update this Cookie Policy?</h2>
                <p className="text-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time in order to reflect, for example, changes 
                  to the cookies we use or for other operational, legal, or regulatory reasons. Please 
                  therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and 
                  related technologies.
                </p>
                <p className="text-foreground leading-relaxed mt-4">
                  The date at the top of this Cookie Policy indicates when it was last updated.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Where can I get further information?</h2>
                <p className="text-foreground leading-relaxed">
                  If you have any questions about our use of cookies or other technologies, please email us at{' '}
                  <a 
                    href="mailto:clivemchd@gmail.com" 
                    className="text-primary hover:underline"
                  >
                    clivemchd@gmail.com
                  </a>{' '}
                </p>
                <div className="mt-4">
                  <p className="font-medium text-foreground">MacDev</p>
                </div>
              </section>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t">
            <Link 
              to="/" 
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
