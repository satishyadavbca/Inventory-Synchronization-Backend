import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from "./auth/auth.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { LicensesModule } from "./licenses/licenses.module"; // Add this
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotificationModule } from "./notification/notification.module";
import {GstModule} from "./gst/gst.module";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            "req.headers.cookie",
            'res.headers["set-cookie"]',
            "req.body.password",
            "req.body.refreshToken",
          ],
          censor: "[REDACTED]",
        },
      },
    }),
    PrismaModule,
    AuthModule,
    InventoryModule,
    UsersModule,
    LicensesModule,
    EventEmitterModule.forRoot(), // <-- Enables global events
    NotificationModule,
    GstModule,
  ],
})
export class AppModule {}
