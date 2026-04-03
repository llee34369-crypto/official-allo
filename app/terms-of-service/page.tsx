import { LegalDocumentPage } from '@/components/LegalDocumentPage';

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      eyebrow="TERMS OF SERVICE"
      title="Terms of Service"
      intro="SpeakerAI Protocol"
      sections={[
        {
          id: 'acceptance',
          label: '1. Acceptance',
          title: '1. Acceptance of Terms',
          blocks: [
            {
              type: 'paragraph',
              text: 'By accessing or using the SpeakerAI Protocol (“Protocol”), you agree to be bound by these Terms of Service (“Terms”). If you do not agree, you must not use the Protocol.',
            },
          ],
        },
        {
          id: 'description',
          label: '2. Service',
          title: '2. Description of Service',
          blocks: [
            {
              type: 'paragraph',
              text: 'SpeakerAI Protocol is a decentralized AI-powered voice and audio platform that enables users to process, analyze, and generate audio content using blockchain and artificial intelligence technologies.',
            },
            {
              type: 'paragraph',
              text: 'The Protocol may include:',
            },
            {
              type: 'list',
              items: [
                'AI voice and audio processing tools',
                'Content generation features',
                'Blockchain-based transactions',
                'Developer APIs and SDKs',
                'Token-based access and incentives (SPKR)',
              ],
            },
          ],
        },
        {
          id: 'eligibility',
          label: '3. Eligibility',
          title: '3. Eligibility',
          blocks: [
            {
              type: 'paragraph',
              text: 'You must:',
            },
            {
              type: 'list',
              items: [
                'Be at least 18 years old or meet the legal age in your jurisdiction',
                'Have the legal capacity to enter into agreements',
                'Comply with all applicable laws and regulations',
              ],
            },
          ],
        },
        {
          id: 'responsibilities',
          label: '4. Responsibilities',
          title: '4. User Responsibilities',
          blocks: [
            {
              type: 'paragraph',
              text: 'You agree to:',
            },
            {
              type: 'list',
              items: [
                'Use the Protocol only for lawful purposes',
                'Not misuse AI tools for harmful, illegal, or deceptive activities',
                'Not attempt to exploit, hack, or disrupt the system',
                'Maintain the confidentiality of your wallet, keys, and credentials',
              ],
            },
            {
              type: 'paragraph',
              text: 'You are solely responsible for:',
            },
            {
              type: 'list',
              items: [
                'Any content you generate or process',
                'Your blockchain transactions',
                'Your use of SPKR tokens',
              ],
            },
          ],
        },
        {
          id: 'token-usage',
          label: '5. SPKR Usage',
          title: '5. Token Usage (SPKR)',
          blocks: [
            {
              type: 'paragraph',
              text: 'SPKR tokens are used within the ecosystem for:',
            },
            {
              type: 'list',
              items: [
                'Accessing AI services',
                'Paying API usage fees',
                'Participating in staking and governance',
                'Receiving incentives and rewards',
              ],
            },
            {
              type: 'paragraph',
              text: 'Important:',
            },
            {
              type: 'list',
              items: [
                'Tokens do not represent ownership, equity, or securities',
                'Token value may fluctuate',
                'Transactions are irreversible once confirmed on-chain',
              ],
            },
          ],
        },
        {
          id: 'decentralization',
          label: '6. Decentralization',
          title: '6. Decentralization Disclaimer',
          blocks: [
            {
              type: 'paragraph',
              text: 'SpeakerAI Protocol operates in a decentralized environment. Therefore:',
            },
            {
              type: 'list',
              items: [
                'We do not control all aspects of the network',
                'Smart contracts operate autonomously',
                'Users are responsible for interacting with the protocol correctly',
              ],
            },
          ],
        },
        {
          id: 'ip',
          label: '7. IP',
          title: '7. Intellectual Property',
          blocks: [
            {
              type: 'list',
              items: [
                'The Protocol’s underlying technology, branding, and software remain the property of SpeakerAI (unless otherwise open-sourced)',
                'Users retain ownership of their own content',
                'By using the Protocol, you grant a limited license for processing and improving services',
              ],
            },
          ],
        },
        {
          id: 'ai-disclaimer',
          label: '8. AI Disclaimer',
          title: '8. AI-Generated Content Disclaimer',
          blocks: [
            {
              type: 'list',
              items: [
                'AI outputs may not always be accurate or reliable',
                'You are responsible for verifying and using generated content',
                'The Protocol is not liable for decisions made based on AI outputs',
              ],
            },
          ],
        },
        {
          id: 'fees',
          label: '9. Fees',
          title: '9. Fees and Payments',
          blocks: [
            {
              type: 'list',
              items: [
                'Certain features require SPKR token payments',
                'All fees are transparent and executed via blockchain',
                'No refunds once transactions are confirmed',
              ],
            },
          ],
        },
        {
          id: 'liability',
          label: '10. Liability',
          title: '10. Limitation of Liability',
          blocks: [
            {
              type: 'paragraph',
              text: 'To the maximum extent permitted by law:',
            },
            {
              type: 'list',
              items: [
                'SpeakerAI Protocol is provided “as is”',
                'We are not liable for:',
                'Loss of funds',
                'Smart contract vulnerabilities',
                'Data loss or inaccuracies',
                'Market volatility',
              ],
            },
          ],
        },
        {
          id: 'termination',
          label: '11. Termination',
          title: '11. Termination',
          blocks: [
            {
              type: 'paragraph',
              text: 'We reserve the right to:',
            },
            {
              type: 'list',
              items: [
                'Restrict access for violations of these Terms',
                'Modify or discontinue services at any time',
              ],
            },
          ],
        },
        {
          id: 'changes',
          label: '12. Changes',
          title: '12. Changes to Terms',
          blocks: [
            {
              type: 'paragraph',
              text: 'We may update these Terms periodically. Continued use of the Protocol means you accept the updated Terms.',
            },
          ],
        },
        {
          id: 'governing',
          label: '13. Principles',
          title: '13. Governing Principles',
          blocks: [
            {
              type: 'paragraph',
              text: 'Due to the decentralized nature:',
            },
            {
              type: 'list',
              items: [
                'No single jurisdiction may apply',
                'Users must comply with their local laws',
              ],
            },
          ],
        },
      ]}
      nextCard={{
        href: '/privacy-policy',
        label: 'Next Document',
        title: 'Privacy Policy',
        description: 'Continue to the SpeakerAI Protocol privacy policy.',
      }}
    />
  );
}
