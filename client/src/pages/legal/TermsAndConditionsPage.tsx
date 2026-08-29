import LegalPageShell from './LegalPageShell';

const TermsAndConditionsPage = () => (
  <LegalPageShell title="Terms and Conditions" lastUpdated="[PLACEHOLDER: DD Month YYYY]">
    <p>
      These Terms and Conditions ("Terms") govern your access to and use of the Hermoso website and mobile
      applications (the "Service"), owned and operated by ONE2W, Office 4th, Floor 3rd, Haq Centre, Commercial
      Market Rd, near Tehzib Bakers, Rawalpindi, Punjab, Pakistan ("Hermoso", "we", "us"). By creating an account
      or using the Service, you agree to be bound by these Terms, which form a valid and binding electronic
      agreement under the Electronic Transactions Ordinance, 2002 and the Contract Act, 1872.
    </p>

    <h2>1. The Service</h2>
    <p>
      Hermoso is a salon discovery and booking platform that connects customers with salons and their services.
      Hermoso also offers an AI Face Scan feature that provides automated skin/hair-care suggestions based on an
      image you provide.
    </p>

    <h2>2. Eligibility and Accounts</h2>
    <p>
      You must be at least 18 years old, or use the Service under the supervision of a parent/guardian, to
      create an account. You are responsible for maintaining the confidentiality of your login credentials and
      for all activity under your account.
    </p>

    <h2>3. Bookings and Payments</h2>
    <ul>
      <li>Prices for salon services are set by the respective salon and displayed in Pakistani Rupees (PKR).</li>
      <li>Payments made through the Service are processed by our third-party payment gateway, Safepay. By making
        a payment, you also agree to Safepay's applicable terms for processing that transaction.</li>
      <li>A booking is confirmed only once payment is successfully processed and you receive a confirmation.</li>
      <li>Cancellations, no-shows, and refunds are governed by our{' '}
        <a href="/refund-policy">Cancellation &amp; Refund Policy</a>.</li>
    </ul>

    <h2>4. AI Face Scan Disclaimer</h2>
    <p>
      The AI Face Scan feature provides automated, cosmetic suggestions only. It is not a medical device, does
      not provide medical or dermatological diagnosis, and should not be relied upon as a substitute for
      professional medical advice. Consult a qualified professional for any skin, hair, or health concern.
    </p>

    <h2>5. User Conduct</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Provide false information when registering or booking.</li>
      <li>Use the Service for any unlawful purpose or in violation of Pakistani law.</li>
      <li>Attempt to interfere with, disrupt, or gain unauthorized access to the Service or its systems.</li>
      <li>Misuse the AI Face Scan feature to upload images of any person without their consent.</li>
    </ul>

    <h2>6. Intellectual Property</h2>
    <p>
      All content, branding, and software associated with the Service are owned by or licensed to Hermoso/ONE2W
      and are protected under applicable Pakistani intellectual property law. You may not copy, reproduce, or
      distribute any part of the Service without our prior written consent.
    </p>

    <h2>7. Disclaimer of Warranties and Limitation of Liability</h2>
    <p>
      The Service is provided "as is" and "as available." To the maximum extent permitted by law, Hermoso
      disclaims all warranties, express or implied, and shall not be liable for indirect, incidental, or
      consequential damages arising from your use of the Service, including the quality of services rendered by
      independent salons listed on the platform.
    </p>

    <h2>8. Termination</h2>
    <p>
      We may suspend or terminate your account if you violate these Terms. You may stop using the Service and
      request account deletion at any time by contacting <a href="mailto:sales@one2w.com">sales@one2w.com</a>.
    </p>

    <h2>9. Governing Law and Jurisdiction</h2>
    <p>
      These Terms are governed by the laws of Pakistan. Any dispute arising out of or relating to these Terms or
      the Service shall be subject to the exclusive jurisdiction of the courts of Rawalpindi, Punjab, Pakistan.
    </p>

    <h2>10. Changes to These Terms</h2>
    <p>
      We may update these Terms from time to time. Continued use of the Service after an update constitutes your
      acceptance of the revised Terms.
    </p>

    <h2>11. Contact</h2>
    <p>
      Questions about these Terms can be sent to <a href="mailto:sales@one2w.com">sales@one2w.com</a>.
    </p>
  </LegalPageShell>
);

export default TermsAndConditionsPage;
