import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const request = client.request;
    
    if (!request || !request.url) {
      this.logger.warn('Missing request or URL in SessionGuard');
      return false;
    }
    
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      this.logger.warn('No sessionId provided in URL');
      return false;
    }
    
    // Validate session ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      this.logger.warn(`Invalid sessionId format: ${sessionId}`);
      return false;
    }
    
    return true;
  }
}