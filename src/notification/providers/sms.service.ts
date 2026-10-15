// import { Injectable } from "@nestjs/common";
// import twilio from "twilio";

// @Injectable()
// export class SmsService {
//   private client: twilio.Twilio;

//   constructor() {
//     this.client = twilio(
//       process.env.TWILIO_ACCOUNT_SID,
//       process.env.TWILIO_AUTH_TOKEN,
//     );
//   }


  

//   async sendMobileOtp(phone: string, otp: string): Promise<void> {
// //    let result = await this.client.messages.create({
// //       body: `Dear Vyapaari, ${otp} is your One-Time Password (OTP) to complete your Saartho registration. This code is valid for 10 minutes. Please do not share this with anyone. - Saartho`,
// //       from: process.env.TWILIO_PHONE_NUMBER,
// //       to: phone, // Must include country code, e.g., +919876543210
// //     });
// // const result = await this.client.verify.v2
// //   .services(process.env.TWILIO_ACCOUNT_SID!)
// //   .verifications.create({
// //     to: phone, // +919876543210
// //     channel: 'sms',
// //   });


//  const message = await this.client.messages.create({
//     body: "sms_event_notifications",
//     from: "+17372212163",
//     to: "+919984596603",
//   });

//   console.log(message.sid);
    
//   }




// //   async function createMessage() {
// //   const message = await client.messages.create({
// //     body: "sms_event_notifications",
// //     from: "+17372212163",
// //     to: "+919984596603",
// //   });

// //   console.log(message.sid);
// // }
// }
