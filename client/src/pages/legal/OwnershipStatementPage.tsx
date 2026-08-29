import LegalPageShell from './LegalPageShell';

const OwnershipStatementPage = () => (
  <LegalPageShell title="Ownership Statement" lastUpdated="[PLACEHOLDER: DD Month YYYY]">
    <p>This statement confirms the ownership and operation of the Hermoso website and mobile applications.</p>

    <h2>1. Declaration</h2>
    <p>
      The Hermoso website, mobile applications, and all associated online booking services (together, the
      "Service") are wholly owned and operated by:
    </p>
    <ul>
      <li><strong>Legal business name:</strong> ONE2W</li>
      <li><strong>Business type:</strong> [PLACEHOLDER: e.g. Sole Proprietorship / Private Limited Company registered with SECP]</li>
      <li><strong>National Tax Number (NTN) / Registration number:</strong> [PLACEHOLDER]</li>
      <li><strong>Registered/operating address (Pakistan):</strong> Office 4th, Floor 3rd, Haq Centre, Commercial
        Market Rd, near Tehzib Bakers, Rawalpindi, Punjab, Pakistan</li>
      <li><strong>Contact email:</strong> <a href="mailto:sales@one2w.com">sales@one2w.com</a></li>
    </ul>

    <h2>2. Authority</h2>
    <p>
      ONE2W is the sole owner and operator of the Hermoso Service and holds full authority to enter into
      agreements relating to it, including the appointment of third-party payment processors such as Safepay for
      the purpose of accepting and processing customer payments on its behalf.
    </p>

    <h2>3. Authorized Representative</h2>
    <ul>
      <li><strong>Name:</strong> [PLACEHOLDER: authorized representative's full name]</li>
      <li><strong>Designation:</strong> [PLACEHOLDER: e.g. Director / Owner]</li>
      <li><strong>Date:</strong> [PLACEHOLDER: DD Month YYYY]</li>
    </ul>

    <p>
      For any verification queries regarding this Ownership Statement, please contact{' '}
      <a href="mailto:sales@one2w.com">sales@one2w.com</a>.
    </p>
  </LegalPageShell>
);

export default OwnershipStatementPage;
