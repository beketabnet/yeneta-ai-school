/**
 * Event Service - Handles cross-component communication
 * Allows components to subscribe to and emit events for real-time updates
 */

type EventCallback = (data: any) => void;

interface EventSubscription {
  id: string;
  callback: EventCallback;
}

class EventService {
  private events: Map<string, EventSubscription[]> = new Map();
  private subscriptionCounter: number = 0;

  /**
   * Subscribe to an event
   * @param eventName - Name of the event to subscribe to
   * @param callback - Function to call when event is emitted
   * @returns Unsubscribe function
   */
  subscribe(eventName: string, callback: EventCallback): () => void {
    console.log(`[EventService] Subscribing to: ${eventName}`);
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const subscriptionId = `${eventName}_${++this.subscriptionCounter}`;
    const subscription: EventSubscription = {
      id: subscriptionId,
      callback
    };

    this.events.get(eventName)!.push(subscription);

    // Return unsubscribe function
    return () => {
      const subs = this.events.get(eventName);
      if (subs) {
        const index = subs.findIndex(s => s.id === subscriptionId);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event
   * @param eventName - Name of the event to emit
   * @param data - Data to pass to subscribers
   */
  emit(eventName: string, data?: any): void {
    console.log(`[EventService] Emitting event: ${eventName}`, data);
    const subs = this.events.get(eventName);
    if (subs) {
      subs.forEach(subscription => {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Clear all subscriptions for an event
   * @param eventName - Name of the event to clear
   */
  clear(eventName: string): void {
    this.events.delete(eventName);
  }

  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    this.events.clear();
  }
}

// Create singleton instance
const eventService = new EventService();

// Event names constants
export const EVENTS = {
  // Course Request Events
  COURSE_REQUEST_CREATED: 'course_request_created',
  COURSE_REQUEST_UPDATED: 'course_request_updated',
  COURSE_REQUEST_APPROVED: 'course_request_approved',
  COURSE_REQUEST_DECLINED: 'course_request_declined',
  COURSE_REQUEST_UNDER_REVIEW: 'course_request_under_review',

  // Enrollment Request Events
  ENROLLMENT_REQUEST_CREATED: 'enrollment_request_created',
  ENROLLMENT_REQUEST_UPDATED: 'enrollment_request_updated',
  ENROLLMENT_REQUEST_APPROVED: 'enrollment_request_approved',
  ENROLLMENT_REQUEST_DECLINED: 'enrollment_request_declined',
  ENROLLMENT_REQUEST_UNDER_REVIEW: 'enrollment_request_under_review',

  // Course Events
  COURSE_APPROVED: 'course_approved',

  // Grade Events
  GRADE_CREATED: 'grade_created',
  GRADE_UPDATED: 'grade_updated',
  GRADE_DELETED: 'grade_deleted',

  // General Events
  DATA_REFRESH_NEEDED: 'data_refresh_needed'
};

export default eventService;
