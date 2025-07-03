// Webhook Service for receiving external sleep data
// Handles IFTTT, Google Assistant, and other webhook integrations

import { sleepService } from './sleepService';

interface WebhookSleepData {
  date?: string;
  duration?: string;  // "7h 30m" format
  quality?: string;   // "Good", "Fair", "Poor"
  bedtime?: string;   // "11:30 PM"
  wakeTime?: string;  // "7:00 AM"
  rawText?: string;   // Full Google Assistant response
  source: 'ifttt' | 'google_assistant' | 'manual';
}

class WebhookService {
  // Parse Google Assistant sleep response
  parseGoogleAssistantResponse(response: string): Partial<WebhookSleepData> {
    const parsed: Partial<WebhookSleepData> = {
      rawText: response,
      source: 'google_assistant'
    };

    // Extract duration (e.g., "7 hours and 30 minutes", "8h 15m")
    const durationMatch = response.match(/(\d+)\s*(?:hours?|h)\s*(?:and\s*)?(\d+)?\s*(?:minutes?|m)?/i);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2] || '0');
      parsed.duration = `${hours}h ${minutes}m`;
    }

    // Extract quality words
    const qualityWords = ['excellent', 'good', 'fair', 'poor', 'bad'];
    for (const word of qualityWords) {
      if (response.toLowerCase().includes(word)) {
        parsed.quality = word.charAt(0).toUpperCase() + word.slice(1);
        break;
      }
    }

    // Extract times (e.g., "went to bed at 11:30", "woke up at 7:00")
    const bedtimeMatch = response.match(/(?:went to bed|bedtime).*?(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
    if (bedtimeMatch) {
      parsed.bedtime = bedtimeMatch[1];
    }

    const waketimeMatch = response.match(/(?:woke up|wake time).*?(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i);
    if (waketimeMatch) {
      parsed.wakeTime = waketimeMatch[1];
    }

    return parsed;
  }

  // Convert parsed data to Soulence sleep session format
  convertToSleepSession(data: WebhookSleepData): any {
    const now = new Date();
    const sessionDate = data.date || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Parse duration
    let totalSleepDuration = 420; // Default 7 hours
    if (data.duration) {
      const durationMatch = data.duration.match(/(\d+)h\s*(\d+)?m?/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2] || '0');
        totalSleepDuration = hours * 60 + minutes;
      }
    }

    // Parse quality to score
    let qualityScore = 7; // Default
    if (data.quality) {
      const qualityMap: Record<string, number> = {
        'excellent': 9,
        'good': 7,
        'fair': 5,
        'poor': 3,
        'bad': 2
      };
      qualityScore = qualityMap[data.quality.toLowerCase()] || 7;
    }

    // Calculate times
    let bedtime = data.bedtime;
    let wakeTime = data.wakeTime;
    
    if (!bedtime || !wakeTime) {
      // Estimate times based on duration
      const sessionDateTime = new Date(sessionDate + 'T00:00:00');
      const estimatedBedtime = new Date(sessionDateTime.getTime() + 23.5 * 60 * 60 * 1000); // 11:30 PM
      const estimatedWakeTime = new Date(estimatedBedtime.getTime() + totalSleepDuration * 60 * 1000);
      
      bedtime = bedtime || estimatedBedtime.toISOString();
      wakeTime = wakeTime || estimatedWakeTime.toISOString();
    }

    return {
      sessionDate,
      bedtime,
      wakeTime,
      totalSleepDuration,
      sleepEfficiency: Math.min(95, 80 + qualityScore * 2), // Efficiency based on quality
      qualityScore,
      energyLevel: qualityScore,
      moodUponWaking: data.quality === 'Good' || data.quality === 'Excellent' ? 'refreshed' : 'groggy',
      notes: data.rawText ? `Auto-imported from ${data.source}: ${data.rawText}` : `Auto-imported from ${data.source}`,
      dataSource: 'wearable', // Since it comes from Nest Hub
      confidenceScore: 0.8
    };
  }

  // Main webhook handler
  async handleWebhook(webhookData: any): Promise<boolean> {
    try {
      console.log('📨 Received webhook data:', webhookData);

      let sleepData: WebhookSleepData;

      // Handle different webhook formats
      if (webhookData.source === 'ifttt') {
        // IFTTT sends data as value1, value2, value3
        sleepData = {
          rawText: webhookData.value1 || '',
          duration: webhookData.value2 || '',
          quality: webhookData.value3 || '',
          source: 'ifttt'
        };
      } else if (webhookData.rawText) {
        // Direct Google Assistant response
        sleepData = {
          ...webhookData,
          source: 'google_assistant'
        };
      } else {
        // Manual webhook with structured data
        sleepData = webhookData;
      }

      // Parse Google Assistant response if it's text
      if (sleepData.rawText && !sleepData.duration) {
        const parsed = this.parseGoogleAssistantResponse(sleepData.rawText);
        sleepData = { ...sleepData, ...parsed };
      }

      // Convert to sleep session format
      const sessionData = this.convertToSleepSession(sleepData);
      console.log('✅ Converted to sleep session:', sessionData);

      // Save to Soulence
      const session = await sleepService.createSession(sessionData);
      console.log('💾 Saved sleep session:', session.id);

      return true;
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      return false;
    }
  }

  // Generate IFTTT setup instructions
  getIFTTTSetupInstructions(): string {
    return `
🔗 IFTTT Setup Instructions:

1. Create IFTTT account at ifttt.com
2. Create new applet:
   - IF: Google Assistant → "Say a simple phrase"
   - Phrase: "Tell Soulence how I slept"
   - THEN: Webhooks → "Make a web request"
   - URL: ${window.location.origin}/api/webhook/sleep
   - Method: POST
   - Content Type: application/json
   - Body: {"value1":"{{TextField}}", "source":"ifttt"}

3. Test with: "Hey Google, tell Soulence how I slept"
   Then speak: "I slept 7 hours and felt good"
`;
  }

  // Test webhook functionality
  async testWebhook(): Promise<void> {
    const testData = {
      rawText: "You slept for 7 hours and 30 minutes last night. Your sleep quality was good. You went to bed at 11:30 PM and woke up at 7:00 AM.",
      source: 'google_assistant'
    };

    console.log('🧪 Testing webhook with sample data...');
    const success = await this.handleWebhook(testData);
    console.log(success ? '✅ Test successful' : '❌ Test failed');
  }
}

export const webhookService = new WebhookService();