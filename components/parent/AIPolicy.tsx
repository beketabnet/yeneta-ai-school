import React from 'react';
import Card from '../Card';

const AIPolicy: React.FC = () => {
    return (
        <Card title="AI Use Policy & Data Transparency">
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Our Commitment to Responsible AI</h4>
                    <p className="mt-1">
                        The YENETA-Ethiopia platform is committed to using Artificial Intelligence ethically and responsibly to enhance your child's learning experience. Our AI tools are designed to support, not replace, the invaluable role of teachers.
                    </p>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">The 24/7 AI Tutor</h4>
                    <p className="mt-1">
                        The AI Tutor provides personalized, on-demand support for students. Here’s how it works:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li><strong>Adaptive Learning:</strong> The tutor adapts its explanations to your child's learning pace and style. It aims to guide students to answers, not just provide them.</li>
                        <li><strong>Data Usage:</strong> Conversations with the AI Tutor are used to improve its performance and may be reviewed for quality assurance. We do not use this data for advertising.</li>
                        <li><strong>Safety & Monitoring:</strong> The system includes safety filters to detect and prevent inappropriate content. Teacher and admin dashboards may flag conversations that suggest a student is struggling academically or emotionally, allowing for timely intervention.</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Data Privacy & Security</h4>
                    <p className="mt-1">
                        Protecting your child's data is our highest priority. All data, including interactions with AI features, is encrypted and stored securely. We adhere to strict data sovereignty policies, ensuring educational data remains a national asset under sovereign control, as outlined in our strategic plan.
                    </p>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Role as a Parent</h4>
                    <p className="mt-1">
                        We encourage you to talk with your child about using the AI Tutor as a learning tool. You have access to review their progress and communicate with teachers about any insights or concerns.
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default AIPolicy;