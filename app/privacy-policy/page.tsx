import { LegalDocumentPage } from '@/components/LegalDocumentPage';

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      eyebrow="PRIVACY POLICY"
      title="Privacy Policy"
      intro="SpeakerAI Protocol"
      sections={[
        {
          id: 'overview',
          label: '1. Overview',
          title: '1. Overview',
          blocks: [
            {
              type: 'paragraph',
              text: 'SpeakerAI Protocol respects your privacy and is committed to protecting your data while maintaining the principles of decentralization and transparency.',
            },
          ],
        },
        {
          id: 'information',
          label: '2. Information',
          title: '2. Information We Collect',
          blocks: [
            {
              type: 'paragraph',
              text: '2.1 Information You Provide',
            },
            {
              type: 'list',
              items: [
                'Audio inputs and recordings',
                'Text inputs and prompts',
                'Account or API-related data',
              ],
            },
            {
              type: 'paragraph',
              text: '2.2 Automatically Collected Data',
            },
            {
              type: 'list',
              items: [
                'Usage data (interactions with AI tools)',
                'Device and technical data',
                'Blockchain wallet addresses',
              ],
            },
            {
              type: 'paragraph',
              text: '2.3 Blockchain Data',
            },
            {
              type: 'list',
              items: [
                'Transactions are public and stored on-chain',
                'Wallet addresses are visible but not directly linked to identity',
              ],
            },
          ],
        },
        {
          id: 'use-data',
          label: '3. Use of Data',
          title: '3. How We Use Your Data',
          blocks: [
            {
              type: 'paragraph',
              text: 'We use collected data to:',
            },
            {
              type: 'list',
              items: [
                'Provide AI processing and audio services',
                'Improve model performance and accuracy',
                'Enable blockchain transactions',
                'Support developers and integrations',
                'Enhance security and prevent abuse',
              ],
            },
          ],
        },
        {
          id: 'ownership',
          label: '4. Ownership',
          title: '4. Data Ownership',
          blocks: [
            {
              type: 'list',
              items: [
                'You retain ownership of your content',
                'Blockchain data is immutable and cannot be altered',
                'AI processing may temporarily use your data for outputs',
              ],
            },
          ],
        },
        {
          id: 'sharing',
          label: '5. Sharing',
          title: '5. Data Sharing',
          blocks: [
            {
              type: 'paragraph',
              text: 'We do not sell your personal data.',
            },
            {
              type: 'paragraph',
              text: 'We may share data:',
            },
            {
              type: 'list',
              items: [
                'With decentralized network components',
                'With service providers (for infrastructure and processing)',
                'When required by law',
              ],
            },
          ],
        },
        {
          id: 'decentralization',
          label: '6. Transparency',
          title: '6. Decentralization and Transparency',
          blocks: [
            {
              type: 'paragraph',
              text: 'Because the Protocol uses blockchain:',
            },
            {
              type: 'list',
              items: [
                'Transactions are publicly verifiable',
                'Data stored on-chain cannot be deleted',
                'Users must understand the transparency trade-offs',
              ],
            },
          ],
        },
        {
          id: 'security',
          label: '7. Security',
          title: '7. Data Security',
          blocks: [
            {
              type: 'paragraph',
              text: 'We implement:',
            },
            {
              type: 'list',
              items: [
                'Encryption where applicable',
                'Secure infrastructure practices',
                'Smart contract-based verification',
              ],
            },
            {
              type: 'paragraph',
              text: 'However:',
            },
            {
              type: 'list',
              items: [
                'No system is 100% secure',
                'Users must protect their own wallets and keys',
              ],
            },
          ],
        },
        {
          id: 'cookies',
          label: '8. Cookies',
          title: '8. Cookies and Tracking',
          blocks: [
            {
              type: 'paragraph',
              text: 'If applicable (web platforms):',
            },
            {
              type: 'list',
              items: [
                'Cookies may be used for analytics and functionality',
                'Users can disable cookies via browser settings',
              ],
            },
          ],
        },
        {
          id: 'third-party',
          label: '9. Third-Party',
          title: '9. Third-Party Services',
          blocks: [
            {
              type: 'paragraph',
              text: 'The Protocol may integrate third-party tools:',
            },
            {
              type: 'list',
              items: [
                'APIs',
                'Blockchain networks',
                'External applications',
              ],
            },
            {
              type: 'paragraph',
              text: 'We are not responsible for their privacy practices.',
            },
          ],
        },
        {
          id: 'rights',
          label: '10. Rights',
          title: '10. Your Rights',
          blocks: [
            {
              type: 'paragraph',
              text: 'Depending on your jurisdiction, you may:',
            },
            {
              type: 'list',
              items: [
                'Request access to your data',
                'Request deletion (off-chain data only)',
                'Opt out of certain data usage',
              ],
            },
            {
              type: 'paragraph',
              text: 'Note: On-chain data cannot be deleted.',
            },
          ],
        },
        {
          id: 'retention',
          label: '11. Retention',
          title: '11. Data Retention',
          blocks: [
            {
              type: 'list',
              items: [
                'Off-chain data is retained only as necessary',
                'On-chain data is permanent',
              ],
            },
          ],
        },
        {
          id: 'changes',
          label: '12. Changes',
          title: '12. Changes to Privacy Policy',
          blocks: [
            {
              type: 'paragraph',
              text: 'We may update this policy. Continued use of the Protocol means acceptance of changes.',
            },
          ],
        },
        {
          id: 'contact',
          label: '13. Contact',
          title: '13. Contact',
          blocks: [
            {
              type: 'paragraph',
              text: 'For questions or concerns, users may contact the SpeakerAI team through official communication channels.',
            },
          ],
        },
      ]}
      nextCard={{
        href: '/cookie-policy',
        label: 'Next Document',
        title: 'Cookie Policy',
        description: 'Continue to the SpeakerAI Protocol cookie policy.',
      }}
    />
  );
}
