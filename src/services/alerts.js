/**
 * Alert Dispatch Simulation Service
 * 
 * In a real environment, this would integrate with:
 * - Twilio/MSG91 for SMS
 * - Firebase Cloud Messaging (FCM) for push notifications
 * - Email gateways (SendGrid/AWS SES)
 */

export const sendAlert = ({ alertId, channel = "SMS", audience = "District Admin" }) => {
  // Simulate dispatch delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a mock log entry
      const log = {
        id: `log-${Date.now()}`,
        alertId,
        channel,
        audience,
        timestamp: new Date().toISOString(),
        status: "Sent",
        message: `${channel} sent to ${audience} via [Mock Provider]`
      };
      resolve(log);
    }, 800);
  });
};
