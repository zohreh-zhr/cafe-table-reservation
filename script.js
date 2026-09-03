const DEFAULT_TABLES = [
    { id: 1, capacity: 2, status: "available" },
    { id: 2, capacity: 4, status: "available" },
    { id: 3, capacity: 6, status: "available" },
    { id: 4, capacity: 4, status: "available" }
];

function getTables() {
    const saved = localStorage.getItem("cafeTables");
    if (!saved) {
        localStorage.setItem("cafeTables", JSON.stringify(DEFAULT_TABLES));
        return [...DEFAULT_TABLES];
    }
    return JSON.parse(saved);
}

function saveTables(tables) {
    localStorage.setItem("cafeTables", JSON.stringify(tables));
}

function getReservations() {
    return JSON.parse(localStorage.getItem("cafeReservations") || "[]");
}

function saveReservations(reservations) {
    localStorage.setItem("cafeReservations", JSON.stringify(reservations));
}

function showMessage(text, type) {
    const message = document.getElementById("formMessage");
    if (!message) return;
    message.textContent = text;
    message.className = "form-message " + type;
}

function renderTables() {
    const container = document.getElementById("tablesContainer");
    if (!container) return;

    const capacityFilter = document.getElementById("capacityFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;

    const tables = getTables().filter(table => {
        const capacityOk = capacityFilter === "all" || String(table.capacity) === capacityFilter;
        const statusOk = statusFilter === "all" || table.status === statusFilter;
        return capacityOk && statusOk;
    });

    container.innerHTML = "";

    if (tables.length === 0) {
        container.innerHTML = '<div class="empty">میزی با این فیلتر پیدا نشد.</div>';
        return;
    }

    tables.forEach(table => {
        const card = document.createElement("article");
        card.className = "table-card " + table.status;

        const reservedText = table.status === "reserved" ? "رزرو شده" : "آزاد";
        const buttonText = table.status === "reserved" ? "قابل رزرو نیست" : "انتخاب این میز";

        card.innerHTML = `
            <h3>میز ${table.id}</h3>
            <p>ظرفیت: ${table.capacity} نفر</p>
            <span class="status ${table.status}">${reservedText}</span>
            <button class="btn" ${table.status === "reserved" ? "disabled" : ""}>
                ${buttonText}
            </button>
        `;

        if (table.status === "available") {
            card.querySelector("button").addEventListener("click", () => {
                localStorage.setItem("selectedTable", String(table.id));
                window.location.href = "reservation.html";
            });
        }

        container.appendChild(card);
    });
}

function fillTableSelect() {
    const select = document.getElementById("tableSelect");
    if (!select) return;

    const tables = getTables();
    select.innerHTML = '<option value="">انتخاب کنید</option>';

    tables.forEach(table => {
        const option = document.createElement("option");
        option.value = table.id;
        option.textContent = `میز ${table.id} - ${table.capacity} نفره${table.status === "reserved" ? " (رزرو شده)" : ""}`;
        option.disabled = table.status === "reserved";
        select.appendChild(option);
    });

    const selectedTable = localStorage.getItem("selectedTable");
    if (selectedTable) {
        const selected = tables.find(table =>
            String(table.id) === selectedTable && table.status === "available"
        );
        if (selected) select.value = selectedTable;
        localStorage.removeItem("selectedTable");
    }
}

function clearErrors() {
    document.querySelectorAll(".error").forEach(error => error.textContent = "");
}

function validateReservation() {
    clearErrors();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const guests = Number(document.getElementById("guests").value);
    const tableId = Number(document.getElementById("tableSelect").value);
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    let valid = true;

    if (name.length < 3) {
        document.getElementById("nameError").textContent = "نام را درست وارد کنید.";
        valid = false;
    }

    if (!/^09\d{9}$/.test(phone)) {
        document.getElementById("phoneError").textContent = "شماره تلفن باید ۱۱ رقم و با 09 شروع شود.";
        valid = false;
    }

    if (!Number.isInteger(guests) || guests < 1) {
        document.getElementById("guestsError").textContent = "تعداد نفرات را وارد کنید.";
        valid = false;
    }

    const tables = getTables();
    const table = tables.find(item => item.id === tableId);

    if (!table) {
        document.getElementById("tableError").textContent = "لطفاً یک میز انتخاب کنید.";
        valid = false;
    } else if (table.status === "reserved") {
        document.getElementById("tableError").textContent = "این میز قبلاً رزرو شده است.";
        valid = false;
    } else if (guests > table.capacity) {
        document.getElementById("tableError").textContent =
            `این میز فقط ظرفیت ${table.capacity} نفر را دارد.`;
        valid = false;
    }

    if (!date) {
        document.getElementById("dateError").textContent = "تاریخ را انتخاب کنید.";
        valid = false;
    }

    if (!time) {
        document.getElementById("timeError").textContent = "ساعت را انتخاب کنید.";
        valid = false;
    }

    return valid;
}

function setupReservationForm() {
    const form = document.getElementById("reservationForm");
    if (!form) return;

    fillTableSelect();

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!validateReservation()) {
            showMessage("لطفاً خطاهای فرم را برطرف کنید.", "fail");
            return;
        }

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const guests = Number(document.getElementById("guests").value);
        const tableId = Number(document.getElementById("tableSelect").value);
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;

        const tables = getTables();
        const table = tables.find(item => item.id === tableId);

        if (!table || table.status !== "available" || guests > table.capacity) {
            showMessage("امکان ثبت این رزرو وجود ندارد.", "fail");
            return;
        }

        table.status = "reserved";
        saveTables(tables);

        const reservations = getReservations();
        reservations.push({
            id: Date.now(),
            name,
            phone,
            guests,
            tableId,
            date,
            time
        });
        saveReservations(reservations);

        form.reset();
        fillTableSelect();
        showMessage("رزرو با موفقیت ثبت شد.", "success");
    });
}

function renderReservations() {
    const container = document.getElementById("reservationsContainer");
    if (!container) return;

    const reservations = getReservations();
    container.innerHTML = "";

    if (reservations.length === 0) {
        container.innerHTML = '<div class="empty">هنوز هیچ رزروی ثبت نشده است.</div>';
        return;
    }

    reservations.forEach(reservation => {
        const card = document.createElement("article");
        card.className = "reservation-card";

        card.innerHTML = `
            <h3>رزرو میز ${reservation.tableId}</h3>
            <p><strong>نام:</strong> ${reservation.name}</p>
            <p><strong>تعداد نفرات:</strong> ${reservation.guests}</p>
            <p><strong>تاریخ:</strong> ${reservation.date}</p>
            <p><strong>ساعت:</strong> ${reservation.time}</p>
            <button class="btn cancel-btn">لغو رزرو</button>
        `;

        card.querySelector(".cancel-btn").addEventListener("click", () => {
            cancelReservation(reservation.id);
        });

        container.appendChild(card);
    });
}

function cancelReservation(reservationId) {
    const reservations = getReservations();
    const reservation = reservations.find(item => item.id === reservationId);

    if (!reservation) return;

    const updatedReservations = reservations.filter(item => item.id !== reservationId);
    saveReservations(updatedReservations);

    const tables = getTables();
    const table = tables.find(item => item.id === reservation.tableId);
    if (table) {
        table.status = "available";
        saveTables(tables);
    }

    renderReservations();
}
function setupPersianDatePicker() {
    const dateInput = document.getElementById("date");

    if (!dateInput || typeof $ === "undefined" || !$.fn.persianDatepicker) {
        return;
    }

    $(dateInput).persianDatepicker({
        format: "YYYY/MM/DD",
        autoClose: true,
        initialValue: false
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("cafeTables")) {
        saveTables(DEFAULT_TABLES);
    }

    renderTables();
    setupReservationForm();
    renderReservations();
    setupPersianDatePicker();

    const capacityFilter = document.getElementById("capacityFilter");
    const statusFilter = document.getElementById("statusFilter");

    if (capacityFilter) capacityFilter.addEventListener("change", renderTables);
    if (statusFilter) statusFilter.addEventListener("change", renderTables);
});
