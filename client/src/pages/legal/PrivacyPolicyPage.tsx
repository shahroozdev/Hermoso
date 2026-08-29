import LegalPageShell from './LegalPageShell';

const PrivacyPolicyPage = () => (
  <LegalPageShell title="Privacy Policy" lastUpdated="March 2026">
    <p>
      Hermoso ("Hermoso", "we", "us", or "our") is owned and operated by ONE2W, with its Pakistan
      office at Office 4th, Floor 3rd, Haq Centre, Commercial Market Rd, near Tehzib Bakers,
      Rawalpindi, Punjab, Pakistan ("we", "the Company"). This Privacy Policy explains how we
      collect, use, store, and protect information when you use the Hermoso website, mobile
      apps, and salon booking platform (together, the "Service"). By using the Service, you
      agree to the practices described in this Policy.
    </p>

    <h2>1. Information We Collect</h2>
    <p>We collect the following categories of information:</p>
    <ul>
      <li><strong>Account information:</strong> name, email address, phone number, and password when you register.</li>
      <li><strong>Booking information:</strong> appointment history, selected salons and services, and payment status.</li>
      <li><strong>Location information:</strong> approximate or precise location, used to calculate distance to salons and to sort/match nearby salons for you.</li>
      <li>
        <strong>Face scan / biometric data:</strong> if you use the AI Face Scan feature, we process images of your
        face to generate skin/hair-care suggestions. These images and any derived scan results are sensitive
        personal data. We only process them with your active, in-app consent at the time you initiate a scan, and
        you may request deletion of this data at any time (see Section 6).
      </li>
      <li><strong>Payment information:</strong> we do not collect or store your card number, CVV, or full payment
        credentials. Payments are processed by our payment partner, Safepay, in accordance with their own
        privacy and security standards (including PCI-DSS). We only receive confirmation of payment status and a
        transaction reference.</li>
      <li><strong>Device and usage information:</strong> app version, device type, and basic diagnostic/log data used
        to keep the Service secure and working correctly.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To create and manage your account and bookings.</li>
      <li>To connect you with salons, calculate distance, and provide salon recommendations.</li>
      <li>To generate AI Face Scan suggestions, where you have opted in.</li>
      <li>To process payments through Safepay and confirm booking status.</li>
      <li>To send booking confirmations, reminders, and service-related notifications.</li>
      <li>To detect, investigate, and prevent fraud, abuse, or violations of our Terms and Conditions.</li>
      <li>To comply with applicable law, including requests from lawful authorities in Pakistan.</li>
    </ul>

    <h2>3. Sharing of Information</h2>
    <p>
      We share information only where necessary to operate the Service:
    </p>
    <ul>
      <li>With the salon/salon owner you book with, to the extent needed to fulfil your appointment (e.g. your name, contact number, and booking details).</li>
      <li>With Safepay, our payment gateway partner, to process payments.</li>
      <li>With service providers who support our infrastructure (e.g. hosting), under confidentiality obligations.</li>
      <li>Where required by Pakistani law, regulation, or a valid order from a competent authority.</li>
    </ul>
    <p>We do not sell your personal information to third parties.</p>

    <h2>4. Data Storage and Security</h2>
    <p>
      We apply reasonable technical and organizational measures to protect your information against unauthorized
      access, alteration, disclosure, or destruction. Payment-related data handled by Safepay is stored and
      processed in line with State Bank of Pakistan requirements applicable to licensed payment service
      providers. No method of transmission or storage is completely secure, and we cannot guarantee absolute
      security.
    </p>

    <h2>5. Data Retention</h2>
    <p>
      We retain account and booking information for as long as your account is active and as needed to comply
      with our legal and accounting obligations. Face scan images are retained only for as long as needed to
      generate your results, unless you choose to save them in your progress history, and are deleted upon your
      request.
    </p>

    <h2>6. Your Rights</h2>
    <p>
      You may request access to, correction of, or deletion of your personal information, and may withdraw
      consent to the AI Face Scan feature at any time, by contacting us at{' '}
      <a href="mailto:sales@one2w.com">sales@one2w.com</a>. We will respond within a reasonable time.
    </p>

    <h2>7. Children's Privacy</h2>
    <p>
      The Service is not directed at children under 18. If you are under 18, you may only use the Service with
      the involvement and consent of a parent or guardian, including for any payment made on your behalf.
    </p>

    <h2>8. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time. Material changes will be reflected by updating the
      "Last updated" date above. Continued use of the Service after changes take effect constitutes acceptance
      of the revised Policy.
    </p>

    <h2>9. Governing Law and Contact</h2>
    <p>
      This Policy is governed by the laws of Pakistan, including the Prevention of Electronic Crimes Act, 2016.
      For questions about this Policy or your data, contact us at{' '}
      <a href="mailto:sales@one2w.com">sales@one2w.com</a> or write to us at: Office 4th, Floor 3rd, Haq Centre,
      Commercial Market Rd, near Tehzib Bakers, Rawalpindi, Punjab, Pakistan.
    </p>
  </LegalPageShell>
);

export default PrivacyPolicyPage;
