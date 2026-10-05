// ================================
// SPENDWISE EXPENSE TRACKER
// ================================


// ---------- CONSTANTS ----------

const incomeCategories = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Other Income"
];

const expenseCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Rent",
    "Other"
];


// ---------- DOM ELEMENTS ----------

const transactionForm = document.getElementById("transactionForm");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const transactionList = document.getElementById("transactionList");

const totalIncomeElement = document.getElementById("totalIncome");
const totalExpenseElement = document.getElementById("totalExpense");
const balanceElement = document.getElementById("balance");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formMessage = document.getElementById("formMessage");

const budgetInput = document.getElementById("budgetInput");
const setBudgetBtn = document.getElementById("setBudgetBtn");

const budgetAmount = document.getElementById("budgetAmount");
const budgetSpent = document.getElementById("budgetSpent");
const budgetProgress = document.getElementById("budgetProgress");
const budgetMessage = document.getElementById("budgetMessage");

const insightBox = document.getElementById("insightBox");

const themeToggle = document.getElementById("themeToggle");


// ---------- STATE ----------

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let monthlyBudget =
    Number(localStorage.getItem("monthlyBudget")) || 0;

let editingId = null;

let expenseChart = null;


// ---------- INITIALIZATION ----------

document.addEventListener("DOMContentLoaded", () => {

    dateInput.value = getTodayDate();

    updateCategories();

    updateCategoryFilter();

    renderTransactions();

    updateSummary();

    updateBudget();

    updateChart();

    updateInsight();

    loadTheme();
});


// ---------- DATE ----------

function getTodayDate() {

    const today = new Date();

    return today.toISOString().split("T")[0];
}


// ---------- CURRENCY ----------

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}


// ---------- CATEGORIES ----------

function updateCategories() {

    const selectedType = typeInput.value;

    const categories =
        selectedType === "income"
            ? incomeCategories
            : expenseCategories;

    categoryInput.innerHTML =
        `<option value="">Select category</option>`;

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryInput.appendChild(option);
    });
}


// Update categories when type changes
typeInput.addEventListener("change", updateCategories);


// ---------- CATEGORY FILTER ----------

function updateCategoryFilter() {

    const allCategories = [
        ...new Set([
            ...incomeCategories,
            ...expenseCategories
        ])
    ];

    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;

    allCategories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}


// ---------- ADD / UPDATE TRANSACTION ----------

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();


    // Validation

    if (!amount || amount <= 0) {

        showMessage(
            "Please enter a valid amount greater than ₹0.",
            "error"
        );

        return;
    }

    if (!category) {

        showMessage(
            "Please select a category.",
            "error"
        );

        return;
    }

    if (!date) {

        showMessage(
            "Please select a date.",
            "error"
        );

        return;
    }

    if (!description) {

        showMessage(
            "Please enter a description.",
            "error"
        );

        return;
    }


    // EDIT

    if (editingId !== null) {

        const transaction =
            transactions.find(item => item.id === editingId);

        if (transaction) {

            transaction.type = type;
            transaction.amount = amount;
            transaction.category = category;
            transaction.date = date;
            transaction.description = description;
        }

        showMessage(
            "Transaction updated successfully.",
            "success"
        );

    }

    // ADD

    else {

        const newTransaction = {

            id: Date.now(),

            type: type,

            amount: amount,

            category: category,

            date: date,

            description: description
        };

        transactions.push(newTransaction);

        showMessage(
            "Transaction added successfully.",
            "success"
        );
    }


    saveTransactions();

    resetForm();

    renderTransactions();

    updateSummary();

    updateBudget();

    updateChart();

    updateInsight();
});


// ---------- SAVE TRANSACTIONS ----------

function saveTransactions() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


// ---------- RENDER TRANSACTIONS ----------

function renderTransactions() {

    const searchTerm =
        searchInput.value.toLowerCase().trim();

    const selectedType =
        typeFilter.value;

    const selectedCategory =
        categoryFilter.value;


    let filteredTransactions =
        transactions.filter(transaction => {

            const matchesSearch =
                transaction.description
                    .toLowerCase()
                    .includes(searchTerm)
                ||
                transaction.category
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesType =
                selectedType === "all"
                ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all"
                ||
                transaction.category === selectedCategory;

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory
            );
        });


    // Sort newest first

    filteredTransactions.sort(
        (a, b) =>
            new Date(b.date) - new Date(a.date)
    );


    // Empty state

    if (filteredTransactions.length === 0) {

        transactionList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">💰</div>

                <h3>No transactions found</h3>

                <p>
                    Add your first transaction to start
                    tracking your finances.
                </p>

            </div>
        `;

        return;
    }


    transactionList.innerHTML = "";


    filteredTransactions.forEach(transaction => {

        const transactionElement =
            document.createElement("div");

        transactionElement.className = "transaction";


        const sign =
            transaction.type === "income"
                ? "+"
                : "-";


        const icon =
            transaction.type === "income"
                ? "↗"
                : "↘";


        transactionElement.innerHTML = `

            <div class="transaction-left">

                <div class="transaction-icon ${transaction.type}">
                    ${icon}
                </div>

                <div>

                    <div class="transaction-description">
                        ${escapeHTML(transaction.description)}
                    </div>

                    <div class="transaction-meta">
                        ${escapeHTML(transaction.category)}
                        •
                        ${formatDate(transaction.date)}
                    </div>

                </div>

            </div>


            <div class="transaction-right">

                <div class="transaction-amount ${transaction.type}">
                    ${sign}${formatCurrency(transaction.amount)}
                </div>

                <div class="action-buttons">

                    <button
                        class="action-btn"
                        onclick="editTransaction(${transaction.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="action-btn"
                        onclick="deleteTransaction(${transaction.id})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;

        transactionList.appendChild(transactionElement);
    });
}


// ---------- ESCAPE HTML ----------

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ---------- DATE FORMAT ----------

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ---------- SUMMARY ----------

function updateSummary() {

    let income = 0;

    let expense = 0;


    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += transaction.amount;

        } else {

            expense += transaction.amount;
        }
    });


    const balance = income - expense;


    totalIncomeElement.textContent =
        formatCurrency(income);

    totalExpenseElement.textContent =
        formatCurrency(expense);

    balanceElement.textContent =
        formatCurrency(balance);
}


// ---------- EDIT ----------

function editTransaction(id) {

    const transaction =
        transactions.find(item => item.id === id);

    if (!transaction) return;


    editingId = id;


    typeInput.value = transaction.type;

    updateCategories();

    categoryInput.value = transaction.category;

    amountInput.value = transaction.amount;

    dateInput.value = transaction.date;

    descriptionInput.value =
        transaction.description;


    formTitle.textContent =
        "Edit Transaction";

    submitBtn.textContent =
        "Update Transaction";

    cancelEditBtn.classList.remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ---------- DELETE ----------

function deleteTransaction(id) {

    const transaction =
        transactions.find(item => item.id === id);

    if (!transaction) return;


    const confirmed =
        confirm(
            `Delete "${transaction.description}"?`
        );

    if (!confirmed) return;


    transactions =
        transactions.filter(
            item => item.id !== id
        );


    saveTransactions();

    renderTransactions();

    updateSummary();

    updateBudget();

    updateChart();

    updateInsight();
}


// ---------- RESET FORM ----------

function resetForm() {

    transactionForm.reset();

    dateInput.value = getTodayDate();

    typeInput.value = "expense";

    updateCategories();

    editingId = null;

    formTitle.textContent =
        "Add Transaction";

    submitBtn.textContent =
        "Add Transaction";

    cancelEditBtn.classList.add("hidden");
}


// ---------- CANCEL EDIT ----------

cancelEditBtn.addEventListener(
    "click",
    resetForm
);


// ---------- SEARCH & FILTERS ----------

searchInput.addEventListener(
    "input",
    renderTransactions
);

typeFilter.addEventListener(
    "change",
    renderTransactions
);

categoryFilter.addEventListener(
    "change",
    renderTransactions
);


// ---------- MESSAGE ----------

function showMessage(message, type) {

    formMessage.textContent = message;

    formMessage.style.color =
        type === "success"
            ? "#16a34a"
            : "#dc2626";


    setTimeout(() => {

        formMessage.textContent = "";

    }, 3000);
}


// ---------- BUDGET ----------

setBudgetBtn.addEventListener(
    "click",
    () => {

        const budget =
            Number(budgetInput.value);


        if (!budget || budget <= 0) {

            budgetMessage.textContent =
                "Please enter a valid budget.";

            return;
        }


        monthlyBudget = budget;

        localStorage.setItem(
            "monthlyBudget",
            monthlyBudget
        );


        budgetInput.value = "";

        updateBudget();
    }
);


// ---------- UPDATE BUDGET ----------

function updateBudget() {

    const currentMonth =
        new Date().toISOString().slice(0, 7);


    const monthlyExpenses =
        transactions
            .filter(transaction =>
                transaction.type === "expense"
                &&
                transaction.date.startsWith(currentMonth)
            )
            .reduce(
                (sum, transaction) =>
                    sum + transaction.amount,
                0
            );


    budgetAmount.textContent =
        formatCurrency(monthlyBudget);

    budgetSpent.textContent =
        formatCurrency(monthlyExpenses);


    if (monthlyBudget <= 0) {

        budgetProgress.style.width = "0%";

        budgetMessage.textContent =
            "Set a monthly budget to monitor your spending.";

        return;
    }


    const percentage =
        (monthlyExpenses / monthlyBudget) * 100;


    budgetProgress.style.width =
        `${Math.min(percentage, 100)}%`;


    if (percentage > 100) {

        budgetMessage.textContent =
            `⚠️ You have exceeded your budget by ${formatCurrency(
                monthlyExpenses - monthlyBudget
            )}.`;

    }

    else if (percentage >= 80) {

        budgetMessage.textContent =
            "⚠️ You have used more than 80% of your budget.";

    }

    else {

        budgetMessage.textContent =
            `You have ${formatCurrency(
                monthlyBudget - monthlyExpenses
            )} remaining this month.`;
    }
}


// ---------- CHART ----------

function updateChart() {

    const expenseData = {};


    transactions
        .filter(transaction =>
            transaction.type === "expense"
        )
        .forEach(transaction => {

            if (!expenseData[transaction.category]) {

                expenseData[transaction.category] = 0;
            }

            expenseData[transaction.category] +=
                transaction.amount;
        });


    const labels =
        Object.keys(expenseData);

    const data =
        Object.values(expenseData);


    const canvas =
        document.getElementById("expenseChart");


    if (expenseChart) {

        expenseChart.destroy();
    }


    expenseChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [{

                    data: data

                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"
                    }
                }
            }
        });
}


// ---------- FINANCIAL INSIGHT ----------

function updateInsight() {

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    if (expenses.length === 0) {

        insightBox.textContent =
            "Add expenses to see your financial insight.";

        return;
    }


    const totalExpenses =
        expenses.reduce(
            (sum, transaction) =>
                sum + transaction.amount,
            0
        );


    const categoryTotals = {};


    expenses.forEach(transaction => {

        if (!categoryTotals[transaction.category]) {

            categoryTotals[transaction.category] = 0;
        }

        categoryTotals[transaction.category] +=
            transaction.amount;
    });


    const highestCategory =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];


    const percentage =
        (
            highestCategory[1] /
            totalExpenses
        ) * 100;


    insightBox.innerHTML = `
        💡 Your highest expense category is
        <strong>${escapeHTML(highestCategory[0])}</strong>,
        accounting for
        <strong>${percentage.toFixed(1)}%</strong>
        of your total expenses.
        <br><br>
        Total spending:
        <strong>${formatCurrency(totalExpenses)}</strong>
    `;
}


// ---------- DARK MODE ----------

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");

        const darkMode =
            document.body.classList.contains("dark");


        localStorage.setItem(
            "darkMode",
            darkMode
        );


        themeToggle.textContent =
            darkMode ? "☀️" : "🌙";
    }
);


// ---------- LOAD THEME ----------

function loadTheme() {

    const darkMode =
        localStorage.getItem("darkMode") === "true";


    if (darkMode) {

        document.body.classList.add("dark");

        themeToggle.textContent = "☀️";
    }
}