import React from 'react';
import { View } from '../../App';
import InfoPageLayout from './InfoPageLayout';

interface PrivacyPolicyPageProps {
  setView: (view: View) => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ setView }) => {
  return (
    <InfoPageLayout title="Privacy Policy" setView={setView}>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        YENETA-Ethiopia ("us", "we", or "our") operates the YENETA platform (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
      </p>
      
      <h2>1. Information Collection and Use</h2>
      <p>
        We collect several different types of information for various purposes to provide and improve our Service to you. This includes, but is not limited to, student performance data, user-provided content, and interaction data with our AI features.
      </p>
      
      <h2>2. Data Usage for AI Features</h2>
      <p>
        Data collected through interactions with AI tools, such as the AI Tutor and Engagement Monitor, is used solely for educational purposes. This includes personalizing learning paths, providing real-time feedback, and generating insights for educators. All video data from the Engagement Monitor is processed on-device and is not stored or transmitted.
      </p>

      <h2>3. Data Sovereignty</h2>
      <p>
        We adhere to strict data sovereignty policies. All educational data is treated as a national asset and is stored and processed within secure environments that comply with local regulations, ensuring it remains under sovereign control.
      </p>
      
      <h2>4. Security of Data</h2>
      <p>
        The security of your data is important to us. We use state-of-the-art encryption and security measures to protect your information from unauthorized access, alteration, or disclosure.
      </p>

      <h2>5. Changes to This Privacy Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
      </p>
      
      <h2>6. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us.
      </p>
    </InfoPageLayout>
  );
};

export default PrivacyPolicyPage;