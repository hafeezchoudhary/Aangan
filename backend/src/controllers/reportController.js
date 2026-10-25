
const Donation = require("../models/Donation");
const Expense = require("../models/Expense");

const EXPENSE_CATEGORIES = [
    "Food",
    "Clothing",
    "Education",
    "Utilities",
    "Healthcare",
    "Maintenance",
    "Transportation",
    "Other",
];

async function getReportSummary(req, res) {
    try {
        const now = new Date();

        // Include the current month and previous two months.
        const startMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1
        );

        const [
            donationTotals,
            expenseTotals,
            categoryTotals,
            monthlyDonations,
            monthlyExpenses,
        ] = await Promise.all([
            Donation.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            Expense.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            Expense.aggregate([
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            Donation.aggregate([
                {
                    $match: {
                        date: { $gte: startMonth, $lte: now },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$date" },
                            month: { $month: "$date" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            Expense.aggregate([
                {
                    $match: {
                        date: { $gte: startMonth, $lte: now },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$date" },
                            month: { $month: "$date" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
            ]),
        ]);

        const totalDonations = donationTotals[0]?.total || 0;
        const totalExpenses = expenseTotals[0]?.total || 0;

        const spendingByCategory = EXPENSE_CATEGORIES.map((category) => {
            const match = categoryTotals.find(
                (item) => item._id === category
            );

            return {
                category,
                amount: match?.total || 0,
            };
        })
            .filter((item) => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const donationMap = new Map(
            monthlyDonations.map((item) => [
                `${item._id.year}-${item._id.month}`,
                item.total,
            ])
        );

        const expenseMap = new Map(
            monthlyExpenses.map((item) => [
                `${item._id.year}-${item._id.month}`,
                item.total,
            ])
        );

        const monthlySummary = [];

        for (let offset = 0; offset < 3; offset++) {
            const monthDate = new Date(
                now.getFullYear(),
                now.getMonth() - offset,
                1
            );

            const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;

            monthlySummary.push({
                year: monthDate.getFullYear(),
                month: monthDate.getMonth() + 1,
                label: monthDate.toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                }),
                donations: donationMap.get(key) || 0,
                expenses: expenseMap.get(key) || 0,
            });
        }

        return res.json({
            totalDonations,
            totalExpenses,
            balance: totalDonations - totalExpenses,
            spendingByCategory,
            monthlySummary,
        });
    } catch (error) {
        console.error("Report summary error:", error);
        return res.status(500).json({
            message: "Failed to generate financial reports.",
        });
    }
}

module.exports = { getReportSummary };
