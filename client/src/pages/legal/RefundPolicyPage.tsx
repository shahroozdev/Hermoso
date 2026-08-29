import LegalPageShell from './LegalPageShell';

const RefundPolicyPage = () => (
  <LegalPageShell title="Cancellation & Refund Policy" lastUpdated="March 2026">
    <p>
      This Cancellation &amp; Refund Policy applies to salon service bookings made and paid for through the
      Hermoso website and mobile apps ("the Service"), operated by ONE2W. Because Hermoso facilitates bookings
      for services (not physical goods), refunds are handled as described below, consistent with the Punjab
      Consumer Protection Act, 2005 and applicable State Bank of Pakistan guidance on electronic payment refunds.
    </p>

    <h2>1. Cancelling a Booking</h2>
    <ul>
      <li>You may cancel a booking free of charge up to <strong>24 hours before</strong> the scheduled
        appointment time. Any amount paid will be refunded in full.</li>
      <li>Cancellations made <strong>less than 24 hours</strong> before the appointment, and no-shows, are
        non-refundable, as the salon reserves that time slot exclusively for you.</li>
    </ul>

    <h2>2. When You Are Entitled to a Full Refund</h2>
    <p>Regardless of the 24-hour window, you are entitled to a full refund if:</p>
    <ul>
      <li>The salon cancels or is unable to honour your booking.</li>
      <li>A payment was charged more than once for the same booking (duplicate transaction).</li>
      <li>A payment was deducted but the booking was not confirmed due to a technical error.</li>
    </ul>

    <h2>3. How Refunds Are Processed</h2>
    <p>
      Approved refunds are issued to the original payment method used at checkout, through our payment partner
      Safepay. Refunds are typically initiated within 3–5 business days of approval and may take a further
      7–14 business days to reflect in your account, depending on your bank or wallet provider's own processing
      time.
    </p>

    <h2>4. How to Request a Refund</h2>
    <p>
      To request a refund, contact us at <a href="mailto:sales@one2w.com">sales@one2w.com</a> with your booking
      ID, the salon name, and the reason for your request. We aim to acknowledge refund requests within 2
      business days.
    </p>

    <h2>5. Disputed or Failed Transactions</h2>
    <p>
      If a payment was deducted from your account but you did not receive a booking confirmation, contact us
      immediately with your transaction reference so we can investigate with Safepay and, where appropriate,
      issue a refund or confirm your booking.
    </p>

    <h2>6. Changes to This Policy</h2>
    <p>
      We may update this Policy from time to time; changes will be reflected by updating the "Last updated" date
      above.
    </p>
  </LegalPageShell>
);

export default RefundPolicyPage;
