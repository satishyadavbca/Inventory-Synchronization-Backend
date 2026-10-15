import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly logger: PinoLogger) {
    const transportOptions: SMTPTransport.Options = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT) : 587,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendLoginOtp(to: string, name: string, otp: string): Promise<void> {
    console.log(`Sending login OTP to ${to} for user ${name} with OTP: ${otp}`);
    this.logger.info(`Sending login OTP to ${to} for user ${name} with OTP: ${otp}`);
    const mailOptions = {
      from: `"Saartho App" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Your Login OTP & Security Alert",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Saartho</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F8F7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <center>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F4F8F7; padding: 40px 0;">
      <tr>
        <td align="center">
          <!-- Main Container Card -->
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Header Section -->
            <tr>
              <td style="background-color: #10937F; padding: 30px 40px; text-align: left;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Saartho</span>
                <div style="color: #E2E8F0; font-size: 10px; font-weight: 600; letter-spacing: 1px; margin-top: 4px;">SMART VYAPAAR COMPANION</div>
              </td>
            </tr>

            <!-- Content Section -->
            <tr>
              <td style="padding: 40px; text-align: left;">
                <h2 style="color: #1A2130; font-size: 22px; margin-top: 0; margin-bottom: 16px;">Welcome aboard, ${name}! 🚀</h2>
                
                <p style="color: #5F6C7B; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  Thank you for registering with <strong>Saartho</strong>. We are thrilled to partner with you to simplify your billing, track real-time inventory, and keep your business 100% GST-compliant.
                </p>

                <p style="color: #5F6C7B; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                  To complete your verification and unlock your 14-day free trial, please use the One-Time Password (OTP) below:
                </p>

                <!-- OTP Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                  <tr>
                    <td align="center" style="background-color: #F4F8F7; border: 2px dashed #10937F; border-radius: 8px; padding: 20px;">
                      <span style="color: #10937F; font-size: 32px; font-weight: 900; letter-spacing: 6px;">${otp}</span>
                    </td>
                  </tr>
                </table>

                <p style="color: #94A3B8; font-size: 13px; line-height: 1.4; margin-bottom: 30px; text-align: center;">
                  This code is securely generated and will expire in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>

                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0;">

                <!-- Support Section -->
                <p style="color: #5F6C7B; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
                  Need help setting up your workspace? Call our merchant support at <strong style="color: #1A2130;">1800-440-999</strong> or reply directly to this email.
                </p>
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td style="background-color: #F8FAFC; padding: 20px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="color: #94A3B8; font-size: 12px; margin: 0; line-height: 1.4;">
                  © 2026 Saartho Technologies. All rights reserved.<br>
                  Empowering Indian Merchants & Vyapaaris.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`,
    };


    let response = await this.transporter.sendMail(mailOptions);
    this.logger.info(`Email sent to ${to} with OTP: ${otp}. Message ID: ${response}`);
  }
}
