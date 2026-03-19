import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Notification from "../models/Notification.js";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getOverview(req, res) {
  try {
    const now = new Date();

    const sevenDaysAgo = startOfDay(new Date(now));
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalStudents, activeEvents, certificatesIssued, clubRecruitment, dailyAgg, monthlyAgg, recentNotifications] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        Event.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
        Registration.countDocuments({ attendanceStatus: "present" }),
        User.countDocuments({ role: "faculty_coordinator" }),
        Registration.aggregate([
          {
            $match: {
              registeredAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$registeredAt" },
                month: { $month: "$registeredAt" },
                day: { $dayOfMonth: "$registeredAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Registration.aggregate([
          {
            $match: {
              registeredAt: { $gte: sixMonthsAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$registeredAt" },
                month: { $month: "$registeredAt" },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        Notification.find({})
          .sort({ createdAt: -1 })
          .limit(6)
          .select("title audience createdAt"),
      ]);

    const dailyMap = new Map();
    for (const row of dailyAgg) {
      const { year, month, day } = row._id;
      const key = `${year}-${month}-${day}`;
      dailyMap.set(key, row.count || 0);
    }

    const daily = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      daily.push({ label, value: dailyMap.get(key) || 0 });
    }

    const monthlyMap = new Map();
    for (const row of monthlyAgg) {
      const { year, month } = row._id;
      const key = `${year}-${month}`;
      monthlyMap.set(key, row.count || 0);
    }

    const monthly = [];
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(
        sixMonthsAgo.getFullYear(),
        sixMonthsAgo.getMonth() + i,
        1
      );
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = d.toLocaleDateString("en-US", { month: "short" });
      monthly.push({ label, value: monthlyMap.get(key) || 0 });
    }

    const activities = (recentNotifications || []).map((n) => ({
      id: n._id,
      title: n.title || "Announcement",
      audience: n.audience || "all",
      createdAt: n.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents: totalStudents || 0,
          activeEvents: activeEvents || 0,
          certificatesIssued: certificatesIssued || 0,
          clubRecruitment: clubRecruitment || 0,
        },
        chart: {
          daily,
          monthly,
        },
        activities,
      },
      message: "Admin dashboard overview fetched successfully",
    });
  } catch (err) {
    console.error("[AdminDashboardController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

