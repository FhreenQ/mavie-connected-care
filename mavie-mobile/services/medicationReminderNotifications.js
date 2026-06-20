import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const MEDICATION_CHANNEL_ID = "medication-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupMedicationNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(MEDICATION_CHANNEL_ID, {
      name: "Medication reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

function getMedicineName(schedule) {
  return (
    schedule.medicationName ||
    schedule.genericName ||
    schedule.brandName ||
    schedule.name ||
    "your medicine"
  );
}

function getScheduleId(schedule) {
  return (
    schedule.scheduleId ||
    schedule.schedule_id ||
    schedule.id ||
    schedule.medicationId ||
    schedule.medication_id ||
    getMedicineName(schedule)
  );
}

function parseMedicineTime(schedule) {
  const rawTime =
    schedule.nextDoseTime ||
    schedule.next_dose_time ||
    schedule.scheduledTime ||
    schedule.scheduled_time ||
    schedule.time ||
    schedule.reminderTime ||
    schedule.reminder_time;

  if (!rawTime) return null;

  const asDate = new Date(rawTime);
  if (!Number.isNaN(asDate.getTime())) {
    return {
      hour: asDate.getHours(),
      minute: asDate.getMinutes(),
    };
  }

  if (typeof rawTime === "string") {
    const match = rawTime.match(/(\d{1,2}):(\d{2})/);

    if (match) {
      const hour = Number(match[1]);
      const minute = Number(match[2]);

      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute };
      }
    }
  }

  return null;
}

export async function cancelMedicationReminders() {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  const medicationNotifications = scheduledNotifications.filter(
    (notification) =>
      notification.content?.data?.type === "MEDICATION_REMINDER"
  );

  await Promise.all(
    medicationNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

export async function scheduleMedicationReminder(schedule) {
  const time = parseMedicineTime(schedule);

  if (!time) {
    console.log("No valid reminder time for:", schedule);
    return null;
  }

  const medicineName = getMedicineName(schedule);
  const dosage = schedule.dosage || schedule.strength || "";
  const scheduleId = getScheduleId(schedule);

  const notificationId = await Notifications.scheduleNotificationAsync({
    identifier: `mavie-med-${scheduleId}-${time.hour}-${time.minute}`,
    content: {
      title: "MaVie Medication Reminder 💊",
      body: `Time to take ${medicineName}${dosage ? ` (${dosage})` : ""}.`,
      sound: "default",
      data: {
        type: "MEDICATION_REMINDER",
        scheduleId,
        medicineName,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: MEDICATION_CHANNEL_ID,
    },
  });

  return notificationId;
}

export async function syncMedicationReminders(schedules = []) {
  const hasPermission = await setupMedicationNotifications();

  if (!hasPermission) {
    console.log("Notification permission not granted.");
    return {
      permission: false,
      scheduled: 0,
    };
  }

  await cancelMedicationReminders();

  const activeSchedules = schedules.filter((schedule) => {
    if (schedule.status === "inactive") return false;
    if (schedule.isActive === false) return false;
    if (schedule.endDate && new Date(schedule.endDate) < new Date()) return false;
    if (schedule.end_date && new Date(schedule.end_date) < new Date()) return false;
    return true;
  });

  let scheduledCount = 0;

  for (const schedule of activeSchedules) {
    const id = await scheduleMedicationReminder(schedule);
    if (id) scheduledCount += 1;
  }

  console.log(`Scheduled ${scheduledCount} medication reminders.`);

  return {
    permission: true,
    scheduled: scheduledCount,
  };
}

export async function scheduleTestMedicationReminder() {
  await setupMedicationNotifications();

  const trigger =
    Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          channelId: MEDICATION_CHANNEL_ID,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "MaVie Test Reminder 💊",
      body: "This is a test medication reminder.",
      sound: "default",
      data: {
        type: "MEDICATION_REMINDER_TEST",
      },
    },
    trigger,
  });
}