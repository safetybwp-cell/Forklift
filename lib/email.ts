import emailjs from '@emailjs/browser';

// TODO: Replace with your actual EmailJS credentials
const SERVICE_ID = 'service_nosm7gr';
const PUBLIC_KEY = 'Q7ihBzmKWUYOHHmL2';
const TEMPLATE_ID_REQUEST = 'template_nxjk9hg'; // For Managers
const TEMPLATE_ID_APPROVAL = 'template_5w71ck9'; // For Stock/User

export const sendEmail = async (
    templateParams: Record<string, any>,
    type: 'request' | 'approval'
) => {
    try {
        const templateId = type === 'request' ? TEMPLATE_ID_REQUEST : TEMPLATE_ID_APPROVAL;

        const response = await emailjs.send(
            SERVICE_ID,
            templateId,
            templateParams,
            PUBLIC_KEY
        );

        console.log('Email sent successfully!', response.status, response.text);
        return { success: true };
    } catch (err) {
        console.error('Failed to send email:', err);
        return { success: false, error: err };
    }
};
