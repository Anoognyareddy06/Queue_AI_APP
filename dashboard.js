
// ==========================================
// QUEUE AI - ADMIN DASHBOARD
// ==========================================

const STORAGE_KEY = "queueai_demo_state";

// ==========================================
// DOM ELEMENTS
// ==========================================

const tableBody = document.getElementById("queueTableBody");

const totalTokens = document.getElementById("totalTokens");
const waitingCount = document.getElementById("waitingCount");
const servingCount = document.getElementById("servingCount");
const completedCount = document.getElementById("completedCount");

const currentToken = document.getElementById("currentToken");
const currentCustomer = document.getElementById("currentCustomer");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const callNextBtn = document.getElementById("callNextBtn");
const refreshBtn = document.getElementById("refreshBtn");

const resultCount = document.getElementById("resultCount");
const toast = document.getElementById("toast");
const currentDate = document.getElementById("currentDate");

// ==========================================
// APPLICATION DATA
// ==========================================

let tickets = [];
let toastTimer;


// ==========================================
// LOAD TICKETS FROM LOCAL STORAGE
// ==========================================

function loadTickets() {

    try {

        const savedData = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (savedData && Array.isArray(savedData.tickets)) {

            tickets = savedData.tickets;

        } else {

            tickets = [];

        }

    } catch (error) {

        console.error("Error loading queue:", error);

        tickets = [];

    }

    renderDashboard();

}


// ==========================================
// SAVE TICKETS TO LOCAL STORAGE
// ==========================================

function saveTickets() {

    try {

        const savedData = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};

        savedData.tickets = tickets;

        if (typeof savedData.nextNumber !== "number") {

            savedData.nextNumber = 25;

        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(savedData)
        );

    } catch (error) {

        console.error("Error saving queue:", error);

        showToast("Unable to save queue changes.");

    }

}


// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function renderDashboard() {

    const waiting = tickets.filter(
        ticket => ticket.status === "Waiting"
    );

    const serving = tickets.filter(
        ticket => ticket.status === "Serving"
    );

    const completed = tickets.filter(
        ticket => ticket.status === "Completed"
    );


    // Update statistics

    totalTokens.textContent = tickets.length;

    waitingCount.textContent = waiting.length;

    servingCount.textContent = serving.length;

    completedCount.textContent = completed.length;


    // Update currently serving section

    if (serving.length > 0) {

        const activeTicket = serving[0];

        currentToken.textContent =
            activeTicket.token ||
            activeTicket.tokenId ||
            "---";

        currentCustomer.textContent =
            `${activeTicket.name || "Customer"} is currently being served.`;

    } else {

        currentToken.textContent = "---";

        currentCustomer.textContent =
            "No customer is currently being served.";

    }


    // Update queue table

    renderTable();

}


// ==========================================
// DISPLAY QUEUE TABLE
// ==========================================

function renderTable() {

    const searchTerm = searchInput.value
        .toLowerCase()
        .trim();

    const selectedStatus = statusFilter.value;


    // Keep original ticket indexes for actions

    const filteredTickets = tickets
        .map((ticket, index) => ({
            ticket,
            index
        }))
        .filter(({ ticket }) => {

            const token = String(
                ticket.token || ticket.tokenId || ""
            ).toLowerCase();

            const name = String(
                ticket.name || ""
            ).toLowerCase();

            const service = String(
                ticket.service || ""
            ).toLowerCase();

            const phone = String(
                ticket.phone || ""
            ).toLowerCase();


            const matchesSearch =
                token.includes(searchTerm) ||
                name.includes(searchTerm) ||
                service.includes(searchTerm) ||
                phone.includes(searchTerm);


            const matchesStatus =
                selectedStatus === "All" ||
                ticket.status === selectedStatus;


            return matchesSearch && matchesStatus;

        });


    // Update result count

    resultCount.textContent =
        `Showing ${filteredTickets.length} of ${tickets.length} tokens`;


    // Empty table message

    if (filteredTickets.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No matching tokens found.
                </td>
            </tr>
        `;

        return;

    }


    // Generate table rows

    tableBody.innerHTML = filteredTickets.map(
        ({ ticket, index }) => {

            const token = escapeHTML(
                ticket.token || ticket.tokenId || "N/A"
            );

            const name = escapeHTML(
                ticket.name || "Customer"
            );

            const service = escapeHTML(
                ticket.service || "General Service"
            );

            const phone = escapeHTML(
                ticket.phone || "Not provided"
            );


            const status = [
                "Waiting",
                "Serving",
                "Completed"
            ].includes(ticket.status)
                ? ticket.status
                : "Waiting";


            const statusClass = status.toLowerCase();


            // Action buttons

            let action = "";

            if (status === "Waiting") {

                action = `
                    <button
                        class="action-button"
                        data-action="call"
                        data-index="${index}">
                        Call
                    </button>
                `;

            } else if (status === "Serving") {

                action = `
                    <button
                        class="action-button"
                        data-action="complete"
                        data-index="${index}">
                        Complete
                    </button>
                `;

            } else {

                action = `
                    <button class="action-button" disabled>
                        Done
                    </button>
                `;

            }


            return `
                <tr>

                    <td>${token}</td>

                    <td>${name}</td>

                    <td>${service}</td>

                    <td>${phone}</td>

                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>${action}</td>

                </tr>
            `;

        }
    ).join("");

}


// ==========================================
// PREVENT HTML INJECTION
// ==========================================

function escapeHTML(value) {

    return String(value).replace(
        /[&<>"']/g,

        character => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"

        })[character]

    );

}


// ==========================================
// CALL NEXT WAITING CUSTOMER
// ==========================================

function callNextCustomer() {

    // Check whether someone is already being served

    const activeTicket = tickets.find(
        ticket => ticket.status === "Serving"
    );


    if (activeTicket) {

        showToast(
            "Complete the current token before calling another."
        );

        return;

    }


    // Find the first waiting customer

    const nextTicket = tickets.find(
        ticket => ticket.status === "Waiting"
    );


    if (!nextTicket) {

        showToast("There are no customers waiting.");

        return;

    }


    // Change status

    nextTicket.status = "Serving";


    // Save and refresh

    saveTickets();

    renderDashboard();


    showToast(
        `Now serving ${nextTicket.token || nextTicket.tokenId || "next token"}.`
    );

}


// ==========================================
// HANDLE TABLE ACTIONS
// ==========================================

function handleTableAction(event) {

    const button = event.target.closest(
        "button[data-action]"
    );

    if (!button) return;


    const action = button.dataset.action;

    const index = Number(button.dataset.index);

    const ticket = tickets[index];


    if (!ticket) {

        showToast("Token not found. Refresh the dashboard.");

        return;

    }


    // CALL CUSTOMER

    if (action === "call") {

        const activeTicket = tickets.find(
            t => t.status === "Serving"
        );


        if (activeTicket) {

            showToast(
                "Complete the current token first."
            );

            return;

        }


        if (ticket.status !== "Waiting") return;


        ticket.status = "Serving";


        showToast(
            `Now serving ${ticket.token || ticket.tokenId || "token"}.`
        );

    }


    // COMPLETE CUSTOMER SERVICE

    else if (action === "complete") {

        if (ticket.status !== "Serving") return;


        ticket.status = "Completed";


        showToast(
            `${ticket.token || ticket.tokenId || "Token"} completed successfully.`
        );

    }


    // SAVE CHANGES

    saveTickets();

    renderDashboard();

}


// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


// ==========================================
// DISPLAY CURRENT DATE
// ==========================================

currentDate.textContent = new Date().toLocaleDateString(
    "en-IN",
    {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
);


// ==========================================
// EVENT LISTENERS
// ==========================================

// Call next token

callNextBtn.addEventListener(
    "click",
    callNextCustomer
);


// Refresh queue

refreshBtn.addEventListener("click", () => {

    loadTickets();

    showToast("Queue refreshed successfully.");

});


// Search customers

searchInput.addEventListener(
    "input",
    renderTable
);


// Filter by status

statusFilter.addEventListener(
    "change",
    renderTable
);


// Handle Call and Complete buttons

tableBody.addEventListener(
    "click",
    handleTableAction
);


// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

loadTickets();


// ==========================================
// AUTOMATIC UPDATE FROM OTHER TABS
// ==========================================

window.addEventListener("storage", event => {

    if (event.key === STORAGE_KEY) {

        loadTickets();

    }

});
