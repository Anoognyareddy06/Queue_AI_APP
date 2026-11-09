
const STORAGE_KEY = "queueai_demo_state";

const defaultState = {
    nextNumber: 25,
    tickets: []
};

function getState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
    } catch {
        return defaultState;
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function estimateWait(state, service) {
    const waiting = state.tickets.filter(
        ticket => ticket.service === service &&
                  ticket.status === "Waiting"
    ).length;

    return Math.max(4, waiting * 4 + 4);
}

const form = document.getElementById("tokenForm");

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const location = document.getElementById("location").value;
    const service = document.getElementById("service").value;

    if (!name || !phone || !location || !service) {
        alert("Please complete all fields.");
        return;
    }

    const state = getState();

    const number = state.nextNumber++;

    const token = "A-" + String(number).padStart(3, "0");

    const ticket = {
        id: token,
        name: name,
        phone: phone,
        location: location,
        service: service,
        status: "Waiting",
        created: Date.now()
    };

    state.tickets.push(ticket);

    saveState(state);

    const wait = estimateWait(state, service);

    document.getElementById("generatedToken").textContent = token;

    document.getElementById("tokenService").textContent =
        service;

    document.getElementById("tokenWait").textContent =
        "Estimated wait: " + wait + " minutes";

    document.getElementById("tokenModal").classList.add("show");

    form.reset();

});


// CLOSE POPUP

document.getElementById("closeModal").addEventListener("click", function() {

    document.getElementById("tokenModal").classList.remove("show");

});


// CLOSE WHEN CLICKING OUTSIDE

document.getElementById("tokenModal").addEventListener("click", function(event) {

    if (event.target === this) {
        this.classList.remove("show");
    }

});


// MOBILE NAVIGATION

document.getElementById("menuBtn").addEventListener("click", function() {

    document.getElementById("navLinks").classList.toggle("open");

});


// AUTO SELECT SERVICE FROM SERVICE CARDS

document.querySelectorAll("[data-service]").forEach(link => {

    link.addEventListener("click", function() {

        document.getElementById("service").value =
            this.dataset.service;

    });

});
