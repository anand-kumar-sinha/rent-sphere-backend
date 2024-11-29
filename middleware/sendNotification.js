const { admin } = require("../firebase");

const sendNotificationToDevice = async ({fcmToken, title, body}) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: fcmToken,
  };

  try {
    console.log(title, body)
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

module.exports = sendNotificationToDevice;
