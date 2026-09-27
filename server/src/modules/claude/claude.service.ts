import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    if (this.apiKey) {
      try {
        this.client = new Anthropic({
          apiKey: this.apiKey,
        });
      } catch (err) {
        console.warn('Claude client init notice:', err);
      }
    }
  }

  getStatus() {
    const isConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
    return {
      connected: isConfigured,
      provider: 'Anthropic Claude',
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      status: isConfigured ? 'ready' : 'awaiting_api_key',
      instructions: isConfigured
        ? 'Claude API is connected and ready to process requests.'
        : 'To connect Claude with live API queries, add ANTHROPIC_API_KEY to your environment variables (.env file).',
    };
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<{ text: string; source: 'anthropic' | 'fallback' }> {
    // Refresh client in case env var was added
    if (!this.client && process.env.ANTHROPIC_API_KEY) {
      this.initClient();
    }

    if (this.client) {
      try {
        const response = await this.client.messages.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: systemPrompt || 'You are an AI assistant for Raftaar, an ultra-fast food, grocery, and marketplace delivery service in Pakistan. Provide helpful, culturally accurate, and engaging responses.',
          messages: [{ role: 'user', content: prompt }],
        });

        const firstBlock = response.content[0];
        const text = firstBlock.type === 'text' ? firstBlock.text : '';
        return { text, source: 'anthropic' };
      } catch (err: any) {
        console.warn('Claude API call error:', err.message);
        // Fallback to intelligent generation if API key is invalid or quota limited
      }
    }

    // High quality contextual fallback when no key is set yet
    return {
      text: this.getSmartFallback(prompt),
      source: 'fallback',
    };
  }

  private getSmartFallback(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('biryani') || lower.includes('restaurant')) {
      return `Savory, authentic Karachi delicacies prepared with aged aromatic basmati rice, tender seasoned meat, and heritage spices. Served hot with cooling mint raita and crisp salad.`;
    }
    if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('mart')) {
      return `Premium daily essentials and fresh pantry staples sourced daily. Guaranteed high-quality fresh produce, dairy, and household goods delivered to your doorstep in 30 minutes.`;
    }
    return `Raftaar Express Marketplace: Connecting quality local merchants, restaurants, and grocery hubs with lightning-fast delivery across Karachi.`;
  }
}

export const claudeService = new ClaudeService();
