import "../../../index.css";
import Navbar from "../landing/navbar";
import Footer from "../landing/footer";
import { Link } from "react-router-dom";

export const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Last updated: <span className="font-medium">Oct 04, 2025</span>
            </p>
          </div>

          {/* Content - Using prose for automatic styling */}
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-foreground prose-li:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-em:text-foreground">

            {/* Introduction */}
            <p>
              This privacy notice for <strong>MacDev</strong> ('Company', 'we', 'us', or 'our'), describes how and why we might collect, store, use, and/or share ('process') your information when you use our services ('Services'), such as when you:
            </p>

            <ul>
              <li>Download and use our mobile application (Knock), or any other application of ours that links to this privacy notice</li>
              <li>Engage with us in other related ways, including any sales, marketing, or events</li>
            </ul>

            <p>
              <strong>Questions or concerns?</strong> Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
            </p>

            {/* Summary of Key Points */}
            <h2>Summary of Key Points</h2>
            <p>
              <em>This summary provides key points from our privacy notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</em>
            </p>

            <p>
              <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with MacDev and the Services, the choices you make, and the products and features you use.
            </p>

            <p>
              <strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
            </p>

            <p>
              <strong>Do we receive any information from third parties?</strong> We do not receive any information from third parties.
            </p>

            <p>
              <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.
            </p>

            <p>
              <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.
            </p>

            <p>
              <strong>How do we keep your information safe?</strong> We have organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
            </p>

            <p>
              <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
            </p>

            <p>
              <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a <a href="https://app.termly.io/dsar/14e43ddd-965e-42ea-b58b-d75e1fb2a47f" target="_blank" rel="noopener noreferrer">data subject access request</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
            </p>

            {/* Table of Contents */}
            <h2>Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><a href="#infocollect">What information do we collect?</a></li>
              <li><a href="#infouse">How do we process your information?</a></li>
              <li><a href="#legalbases">What legal bases do we rely on to process your personal information?</a></li>
              <li><a href="#whoshare">When and with whom do we share your personal information?</a></li>
              <li><a href="#inforetain">How long do we keep your information?</a></li>
              <li><a href="#infosafe">How do we keep your information safe?</a></li>
              <li><a href="#privacyrights">What are your privacy rights?</a></li>
              <li><a href="#DNT">Controls for Do-Not-Track features</a></li>
              <li><a href="#caresidents">Do California residents have specific privacy rights?</a></li>
              <li><a href="#virginia">Do Virginia residents have specific privacy rights?</a></li>
              <li><a href="#policyupdates">Do we make updates to this notice?</a></li>
              <li><a href="#contact">How can you contact us about this notice?</a></li>
              <li><a href="#request">How can you review, update, or delete the data we collect from you?</a></li>
            </ol>

            {/* Main Sections */}
            <h2 id="infocollect">1. What Information Do We Collect?</h2>
            <h3>Personal information you disclose to us</h3>
            <p>
              <em><strong>In Short:</strong> We collect personal information that you provide to us.</em>
            </p>
            <p>
              We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <p>
              <strong>Sensitive Information.</strong> We do not process sensitive information.
            </p>
            <p>
              All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
            </p>

            <h2 id="infouse">2. How Do We Process Your Information?</h2>
            <p>
              <em><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</em>
            </p>
            <p>
              We process your personal information for a variety of reasons, depending on how you interact with our Services, including to save or protect an individual's vital interest, such as to prevent harm.
            </p>

            <h2 id="legalbases">3. What Legal Bases Do We Rely On To Process Your Information?</h2>
            <p>
              <em><strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e. legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfil our contractual obligations, to protect your rights, or to fulfil our legitimate business interests.</em>
            </p>

            <h3>If you are located in the EU or UK, this section applies to you.</h3>
            <p>
              The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
            </p>
            <ul>
              <li><strong>Consent.</strong> We may process your information if you have given us permission (i.e. consent) to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
              <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
              <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
            </ul>

            <h3>If you are located in Canada, this section applies to you.</h3>
            <p>
              We may process your information if you have given us specific permission (i.e. express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e. implied consent). You can withdraw your consent at any time.
            </p>
            <p>
              In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:
            </p>
            <ul>
              <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
              <li>For investigations and fraud detection and prevention</li>
              <li>For business transactions provided certain conditions are met</li>
              <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
              <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
              <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
              <li>If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
              <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
              <li>If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced</li>
              <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
              <li>If the information is publicly available and is specified by the regulations</li>
            </ul>

            <h2 id="whoshare">4. When And With Whom Do We Share Your Personal Information?</h2>
            <p>
              <em><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</em>
            </p>
            <p>
              We may need to share your personal information in the following situations:
            </p>
            <ul>
              <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>

            <h2 id="inforetain">5. How Long Do We Keep Your Information?</h2>
            <p>
              <em><strong>In Short:</strong> We keep your information for as long as necessary to fulfil the purposes outlined in this privacy notice unless otherwise required by law.</em>
            </p>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
            </p>
            <p>
              When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
            </p>

            <h2 id="infosafe">6. How Do We Keep Your Information Safe?</h2>
            <p>
              <em><strong>In Short:</strong> We aim to protect your personal information through a system of organisational and technical security measures.</em>
            </p>
            <p>
              We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
            </p>

            <h2 id="privacyrights">7. What Are Your Privacy Rights?</h2>
            <p>
              <em><strong>In Short:</strong> In some regions, such as the European Economic Area (EEA), United Kingdom (UK), and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</em>
            </p>
            <p>
              In some regions (like the EEA, UK, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information.
            </p>
            <p>
              We will consider and act upon any request in accordance with applicable data protection laws.
            </p>
            <p>
              If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm" target="_blank" rel="noopener noreferrer">Member State data protection authority</a> or <a href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/" target="_blank" rel="noopener noreferrer">UK data protection authority</a>.
            </p>
            <p>
              If you are located in Switzerland, you may contact the <a href="https://www.edoeb.admin.ch/edoeb/en/home.html" target="_blank" rel="noopener noreferrer">Federal Data Protection and Information Commissioner</a>.
            </p>

            <h3>Withdrawing your consent</h3>
            <p>
              If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us.
            </p>
            <p>
              However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
            </p>
            <p>
              If you have questions or comments about your privacy rights, you may <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
            </p>

            <h2 id="DNT">8. Controls For Do-Not-Track Features</h2>
            <p>
              Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ('DNT') feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this privacy notice.
            </p>

            <h2 id="caresidents">9. Do California Residents Have Specific Privacy Rights?</h2>
            <p>
              <em><strong>In Short:</strong> Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.</em>
            </p>
            <p>
              California Civil Code Section 1798.83, also known as the 'Shine The Light' law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.
            </p>
            <p>
              If you are under 18 years of age, reside in California, and have a registered account with Services, you have the right to request removal of unwanted data that you publicly post on the Services. To request removal of such data, please contact us using the contact information provided below and include the email address associated with your account and a statement that you reside in California. We will make sure the data is not publicly displayed on the Services, but please be aware that the data may not be completely or comprehensively removed from all our systems (e.g. backups, etc.).
            </p>

            <h3>CCPA Privacy Notice</h3>
            <p>
              The California Code of Regulations defines a 'resident' as:
            </p>
            <ul>
              <li>(1) every individual who is in the State of California for other than a temporary or transitory purpose and</li>
              <li>(2) every individual who is domiciled in the State of California who is outside the State of California for a temporary or transitory purpose</li>
            </ul>
            <p>
              All other individuals are defined as 'non-residents'.
            </p>
            <p>
              If this definition of 'resident' applies to you, we must adhere to certain rights and obligations regarding your personal information.
            </p>
            <p>
              MacDev has not sold any personal data to third parties for business or commercial purposes. MacDev will not sell personal data in the future belonging to website visitors, users, and other consumers.
            </p>

            <h2 id="virginia">10. Do Virginia Residents Have Specific Privacy Rights?</h2>
            <p>
              <em><strong>In Short:</strong> Yes, if you are a resident of Virginia, you may be granted specific rights regarding access to and use of your personal information.</em>
            </p>

            <h3>Virginia CDPA Privacy Notice</h3>
            <p>
              Under the Virginia Consumer Data Protection Act (CDPA):
            </p>
            <p>
              'Consumer' means a natural person who is a resident of the Commonwealth acting only in an individual or household context. It does not include a natural person acting in a commercial or employment context.
            </p>
            <p>
              'Personal data' means any information that is linked or reasonably linkable to an identified or identifiable natural person. 'Personal data' does not include de-identified data or publicly available information.
            </p>
            <p>
              'Sale of personal data' means the exchange of personal data for monetary consideration.
            </p>
            <p>
              If this definition 'consumer' applies to you, we must adhere to certain rights and obligations regarding your personal data.
            </p>
            <p>
              MacDev has not sold any personal data to third parties for business or commercial purposes. MacDev will not sell personal data in the future belonging to website visitors, users, and other consumers.
            </p>
            <p>
              If your appeal is denied, you may contact the <a href="https://www.oag.state.va.us/consumer-protection/index.php/file-a-complaint" target="_blank" rel="noopener noreferrer">Attorney General to submit a complaint</a>.
            </p>

            <h2 id="policyupdates">11. Do We Make Updates To This Notice?</h2>
            <p>
              <em><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</em>
            </p>
            <p>
              We may update this privacy notice from time to time. The updated version will be indicated by an updated 'Revised' date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.
            </p>

            <h2 id="contact">12. How Can You Contact Us About This Notice?</h2>
            <p>
              If you have questions or comments about this notice, you may <Link to="/contact" className="text-primary hover:underline">contact us</Link>
            </p>

            <h2 id="request">13. How Can You Review, Update, Or Delete The Data We Collect From You?</h2>
            <p>
              Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please fill out and submit a <a href="https://app.termly.io/dsar/14e43ddd-965e-42ea-b58b-d75e1fb2a47f" target="_blank" rel="noopener noreferrer">data subject access request</a>.
            </p>
            <div className="rounded-lg my-4">
              <p className="font-medium text-foreground mb-1">MacDev</p>
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
