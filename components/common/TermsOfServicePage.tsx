import React from 'react';
import { View } from '../../App';
import InfoPageLayout from './InfoPageLayout';

interface TermsOfServicePageProps {
  setView: (view: View) => void;
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ setView }) => {
  return (
    <InfoPageLayout title="Terms of Service" setView={setView}>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the YENETA platform (the "Service") operated by YENETA-Ethiopia ("us", "we", or "our").
      </p>
      
      <h2>1. Accounts</h2>
      <p>
        When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
      </p>
      
      <h2>2. Acceptable Use</h2>
      <p>
        You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You agree to be responsible for all content you post and for your interactions with other users and AI features.
      </p>

      <h2>3. Intellectual Property</h2>
      <p>
        The Service and its original content, features, and functionality are and will remain the exclusive property of YENETA-Ethiopia. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
      </p>
      
      <h2>4. Termination</h2>
      <p>
        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </p>

      <h2>5. Governing Law</h2>
      <p>
        These Terms shall be governed and construed in accordance with the laws of Ethiopia, without regard to its conflict of law provisions.
      </p>
      
      <h2>6. Changes</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
      </p>
    </InfoPageLayout>
  );
};

export default TermsOfServicePage;