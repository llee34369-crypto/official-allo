import { LegalDocumentPage } from '@/components/LegalDocumentPage';

export default function CookiePolicyPage() {
  return (
    <LegalDocumentPage
      eyebrow="COOKIE POLICY"
      title="Cookie Policy"
      intro="SpeakerAI Protocol"
      sections={[
        {
          id: 'introduction',
          label: '1. Introduction',
          title: '1. Introduction',
          blocks: [
            {
              type: 'paragraph',
              text: 'SpeakerAI Protocol (“Protocol”, “we”, “our”) uses cookies and similar technologies to improve user experience, track usage, and support platform functionality. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.',
            },
            {
              type: 'paragraph',
              text: 'By using our platform, you consent to the use of cookies as described in this policy.',
            },
          ],
        },
        {
          id: 'what-are-cookies',
          label: '2. Cookies',
          title: '2. What Are Cookies?',
          blocks: [
            {
              type: 'paragraph',
              text: 'Cookies are small text files stored on your device by a website or application. They help remember preferences, enhance functionality, and collect usage information.',
            },
            {
              type: 'paragraph',
              text: 'Cookies may be:',
            },
            {
              type: 'list',
              items: [
                'Session Cookies – Temporary, deleted when you close your browser.',
                'Persistent Cookies – Stored longer for remembering preferences and analytics.',
                'Third-Party Cookies – Placed by external services integrated into the Protocol (e.g., analytics tools).',
              ],
            },
          ],
        },
        {
          id: 'how-used',
          label: '3. Usage',
          title: '3. How SpeakerAI Uses Cookies',
          blocks: [
            {
              type: 'paragraph',
              text: 'We use cookies for the following purposes:',
            },
            {
              type: 'paragraph',
              text: '3.1 Platform Functionality',
            },
            {
              type: 'list',
              items: [
                'To remember your preferences and settings',
                'To enable login sessions and access to AI features',
                'To ensure smooth interaction with decentralized services',
              ],
            },
            {
              type: 'paragraph',
              text: '3.2 Analytics and Improvement',
            },
            {
              type: 'list',
              items: [
                'To analyze usage trends',
                'To improve AI models and user experience',
                'To track error reports and performance metrics',
              ],
            },
            {
              type: 'paragraph',
              text: '3.3 Marketing and Communications (Optional)',
            },
            {
              type: 'list',
              items: [
                'For targeted communications or promotions if you opt in',
                'Only with explicit consent',
              ],
            },
          ],
        },
        {
          id: 'third-party',
          label: '4. Third-Party',
          title: '4. Third-Party Cookies',
          blocks: [
            {
              type: 'paragraph',
              text: 'We may use third-party services for:',
            },
            {
              type: 'list',
              items: [
                'Analytics (e.g., Google Analytics, if web-based)',
                'API integrations for user behavior monitoring',
                'Other decentralized ecosystem services',
              ],
            },
            {
              type: 'paragraph',
              text: 'These providers may collect anonymous data about your interactions.',
            },
          ],
        },
        {
          id: 'managing',
          label: '5. Managing',
          title: '5. Managing and Disabling Cookies',
          blocks: [
            {
              type: 'paragraph',
              text: 'You have the right to control cookies:',
            },
            {
              type: 'list',
              items: [
                'Adjust browser settings to refuse or delete cookies',
                'Use privacy-focused tools to block tracking',
                'Note: Disabling certain cookies may affect platform functionality or AI features',
              ],
            },
          ],
        },
        {
          id: 'privacy-security',
          label: '6. Security',
          title: '6. Data Privacy and Security',
          blocks: [
            {
              type: 'list',
              items: [
                'Cookies do not store sensitive personal information like passwords or private keys',
                'We follow encryption and security best practices',
                'On-chain transactions are public, but cookies only handle off-chain session and usage data',
              ],
            },
          ],
        },
        {
          id: 'changes',
          label: '7. Changes',
          title: '7. Changes to Cookie Policy',
          blocks: [
            {
              type: 'paragraph',
              text: 'We may update this Cookie Policy periodically. Continued use of the platform after changes constitutes acceptance.',
            },
          ],
        },
        {
          id: 'contact',
          label: '8. Contact',
          title: '8. Contact',
          blocks: [
            {
              type: 'paragraph',
              text: 'For questions regarding cookies or privacy practices, contact the SpeakerAI team via official channels.',
            },
          ],
        },
      ]}
      nextCard={{
        href: '/documentation',
        label: 'Related Document',
        title: 'Back to Documentation',
        description: 'Return to the SpeakerAI Protocol documentation hub.',
      }}
    />
  );
}
