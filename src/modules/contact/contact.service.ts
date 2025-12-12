import dbConfig from "../../config/db.config";
import { sendEmail } from "../../utils/sendMail";

type ContactPayload = {
  name?: string;
  email: string;
  subject?: string;
  message: string;
};

const submitContact = async (payload: ContactPayload) => {
  const to = dbConfig.smtp.smtp_from || dbConfig.smtp.smtp_user;

  if (!to) {
    throw new Error("SMTP recipient is not configured");
  }

  await sendEmail({
    to,
    subject: payload.subject || "Contact Form Message",
    templateName: "contact",
    templateData: {
      name: payload.name || "Anonymous",
      email: payload.email,
      message: payload.message,
    },
  });

  return { delivered: true };
};

export const ContactService = {
  submitContact,
};
