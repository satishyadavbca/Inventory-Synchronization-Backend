import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extracts the token from the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rejects expired tokens automatically
      secretOrKey: process.env.JWT_ACCESS_SECRET, // MUST match the secret used in JwtModule.register()
    });
  }

  // This payload is the decoded JWT token.
  // Whatever you return here is automatically attached to 'req.user'
  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    
    // Example: If your token payload looks like { sub: 'uuid', phone: '987...', role: 'ADMIN' }
    return { 
      id: payload.sub, 
      phone: payload.phone, 
      role: payload.role 
    };
  }
}