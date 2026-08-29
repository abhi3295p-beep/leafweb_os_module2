export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * EmailProvider is an integration boundary for future Resend/SMTP wiring.
 */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV !== "test") {
      console.info("[email:deferred]", message.subject, message.to);
    }
  }
}
