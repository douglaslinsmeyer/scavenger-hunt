/**
 * TDD Deployment Tests for Player Frontend
 * These tests verify that the application deploys successfully
 */

import axios from 'axios';

describe('Player Frontend Deployment', () => {
  const playerAppUrl = process.env.PLAYER_APP_URL || 'http://localhost:3001';

  describe('Application Accessibility', () => {
    it('should respond with 200 status on home page', async () => {
      // This test will fail initially (Red phase)
      const response = await axios.get(playerAppUrl);
      expect(response.status).toBe(200);
    });

    it('should display the hello world message', async () => {
      const response = await axios.get(playerAppUrl);
      const html = response.data;
      
      // Check for the expected content
      expect(html).toContain('Hello from Scavenger Hunt Player App!');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should have proper content-type header', async () => {
      const response = await axios.get(playerAppUrl);
      const contentType = response.headers['content-type'];
      
      expect(contentType).toContain('text/html');
    });
  });

  describe('Next.js Application Structure', () => {
    it('should include Next.js meta tags', async () => {
      const response = await axios.get(playerAppUrl);
      const html = response.data;
      
      // Verify Next.js is properly configured
      expect(html).toContain('__next');
      expect(html).toMatch(/<meta name="viewport"/);
    });

    it('should handle API routes', async () => {
      // Next.js API route test (will be implemented later)
      const response = await axios.get(`${playerAppUrl}/api/health`);
      expect(response.status).toBeLessThan(500); // Not a server error
    });
  });

  describe('Deployment Verification', () => {
    it('should be accessible within timeout', async () => {
      try {
        const response = await axios.get(playerAppUrl, {
          timeout: 5000,
        });
        
        expect(response.status).toBe(200);
      } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Application not accessible within 5 seconds');
        }
        throw error;
      }
    });

    it('should have required static assets available', async () => {
      const response = await axios.get(playerAppUrl);
      const html = response.data;
      
      // Check for Next.js static assets
      const scriptTags = html.match(/<script[^>]*>/g) || [];
      expect(scriptTags.length).toBeGreaterThan(0);
    });
  });
});