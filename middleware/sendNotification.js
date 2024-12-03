const { admin } = require("../firebase");

const sendNotificationToDevice = async ({ fcmToken, title, body }) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

module.exports = sendNotificationToDevice;
