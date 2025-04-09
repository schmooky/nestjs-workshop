import { Logger, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as WebSocket from 'ws';
import { Server } from 'ws';
import { SignalRMessageType } from './firejoker.types';
import { FirejokerService } from './firejoker.service';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@WebSocketGateway({
  path: '/firejoker/slot',
})
export class FirejokerGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(FirejokerGateway.name);
  
  @WebSocketServer()
  server: Server;
  
  // Track active connections
  private activeConnections = new Map<string, WebSocket>();
  
  constructor(private readonly firejokerService: FirejokerService) {}
  
  onModuleInit() {
    this.logger.log('Firejoker WebSocket Gateway initialized');
  }
  
  async handleConnection(client: WebSocket, request: Request) {
    try {
      this.logger.debug(`New connection attempt. Request URL: ${request.url}`);
      
      // Extract session ID from request URL or generate a new one
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      let sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        sessionId = uuidv4();
        this.logger.debug(`No sessionId provided, generated new sessionId: ${sessionId}`);
      }
      
      // Store sessionId on client for later reference
      (client as any).sessionId = sessionId;
      
      // Add to active connections
      this.activeConnections.set(sessionId, client);
      
      this.logger.log(`Client connected with sessionId: ${sessionId}`);
      
      client.on('message', async (data: WebSocket.Data) => {
        try {
          // Log raw message for debugging
          this.logger.debug(`Raw message received: ${data.toString()}`);
          
          // Convert to string and remove the Information Separator Two (U+001E) character
          let message = data.toString();
          message = message.replace(/\u001E/g, '');
          
          this.logger.debug(`Cleaned message: ${message}`);
          
          // Handle empty messages
          if (!message || message.trim() === '') {
            this.logger.warn('Empty message received');
            return;
          }
          
          // Parse the cleaned message
          try {
            const parsedData = JSON.parse(message);
            
            // Handle handshake
            if (parsedData.protocol && parsedData.version) {
              this.logger.debug(`Handshake protocol: ${parsedData.protocol}, version: ${parsedData.version}`);
              
              if (parsedData.protocol === 'json' && parsedData.version === 1) {
                client.send(this.formatSignalRResponse({}));
                this.logger.debug(`Handshake successful for session ${sessionId}`);
              } else {
                const errorResponse = {
                  error: 'Unsupported protocol or version'
                };
                client.send(this.formatSignalRResponse(errorResponse));
                this.logger.warn(`Unsupported protocol: ${parsedData.protocol} or version: ${parsedData.version}`);
                client.close(1002, 'Unsupported protocol');
              }
            }
            // Handle invocation
            else if (parsedData.type === SignalRMessageType.Invocation) {
              this.logger.debug(`Processing invocation: target=${parsedData.target}, id=${parsedData.invocationId}`);
              await this.processInvocation(client, parsedData, sessionId);
            }
            // Handle other message types
            else {
              this.logger.warn(`Unknown message type: ${parsedData.type || 'undefined'}`);
              const errorResponse = {
                error: `Unknown message type: ${parsedData.type || 'undefined'}`
              };
              client.send(this.formatSignalRResponse(errorResponse));
            }
          } catch (parseError) {
            this.logger.error(`Error parsing JSON message: ${parseError.message}`);
            client.send(this.formatSignalRResponse({ error: 'Invalid JSON format' }));
          }
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`);
          try {
            client.send(this.formatSignalRResponse({ error: 'Internal server error' }));
          } catch (sendError) {
            this.logger.error(`Failed to send error response: ${sendError.message}`);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      try {
        client.send(this.formatSignalRResponse({ error: 'Connection error' }));
        client.close(1011, 'Connection initialization error');
      } catch (closeError) {
        this.logger.error(`Failed to close connection: ${closeError.message}`);
      }
    }
  }
  
  handleDisconnect(client: WebSocket) {
    try {
      const sessionId = (client as any).sessionId || 'unknown';
      this.logger.log(`Client disconnected with sessionId: ${sessionId}`);
      
      // Remove from active connections
      if (sessionId !== 'unknown') {
        this.activeConnections.delete(sessionId);
      }
      
      this.logger.debug(`Active connections remaining: ${this.activeConnections.size}`);
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }
  
  /**
   * Formats a response according to SignalR protocol standards
   * by appending the Information Separator Two character
   */
  private formatSignalRResponse(data: any): string {
    return JSON.stringify(data) + '\u001E';
  }
  
  private async processInvocation(client: WebSocket, invocation: any, sessionId: string) {
    this.logger.debug(`Processing invocation target=${invocation.target}, id=${invocation.invocationId}`);
    
    try {
      let response;
      
      switch (invocation.target) {
        case 'session':
          response = await this.firejokerService.handleSession(
            invocation.invocationId,
            sessionId
          );
          break;
          
        case 'spin':
          const spinRequest = invocation.arguments[0];
          response = await this.firejokerService.handleSpin(
            invocation.invocationId,
            sessionId,
            spinRequest
          );
          break;
          
        default:
          this.logger.warn(`Unknown invocation target: ${invocation.target}`);
          response = {
            type: SignalRMessageType.Completion,
            invocationId: invocation.invocationId,
            error: `Unknown target: ${invocation.target}`,
          };
      }
      
      this.logger.debug(`Sending response for invocation ${invocation.invocationId}`);
      client.send(this.formatSignalRResponse(response));
    } catch (error) {
      this.logger.error(`Error processing invocation: ${error.message}`);
      
      const errorResponse = {
        type: SignalRMessageType.Completion,
        invocationId: invocation.invocationId,
        error: error.message,
      };
      
      client.send(this.formatSignalRResponse(errorResponse));
    }
  }
}