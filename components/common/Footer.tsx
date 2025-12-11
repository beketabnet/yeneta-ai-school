import React from 'react';
import { View } from '../../App';

interface FooterProps {
    setView: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
    return (
        <footer className="bg-transparent">
            <div className="container mx-auto py-6 px-6 text-center text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} YENETA-Ethiopia. All Rights Reserved.</p>
                <div className="mt-2 space-x-4 text-sm">
                    <button onClick={() => setView('landing')} className="hover:underline">Home</button>
                    <span>&middot;</span>
                    <button onClick={() => setView('privacyPolicy')} className="hover:underline">Privacy Policy</button>
                    <span>&middot;</span>
                    <button onClick={() => setView('termsOfService')} className="hover:underline">Terms of Service</button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;