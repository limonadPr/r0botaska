let tasks = [];
let currentEditId = null;

$(document).ready(function () {

    alertify.set('notifier', 'position', 'top-right');
    alertify.set('notifier', 'delay', 3);

    const $title = $(".sidebar input");
    const $text = $(".sidebar textarea");
    const $file = $(".sidebar input[type='file']");
    const $main = $(".main");
    const $archiveList = $(".archive-list");
    const $search = $(".search");

    // ---------------- LOCAL STORAGE ----------------

    function save() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function load() {
        const data = localStorage.getItem("tasks");
        if (data) tasks = JSON.parse(data);
    }

    // ---------------- RENDER ----------------

    function render() {
        $main.find(".task").remove();
        $archiveList.html("");

        const pinned = [];
        const normal = [];

        tasks.forEach(t => {
            if (t.archived) return;
            (t.pinned ? pinned : normal).push(t);
        });

        [...pinned, ...normal].forEach(t => {
            $main.append(createTaskHTML(t));
        });

        tasks.filter(t => t.archived).forEach(t => {
            $archiveList.append(createArchiveHTML(t));
        });

        checkEmpty();
    }

    // ---------------- EMPTY ----------------

    function checkEmpty() {
        $(".empty").remove();

        if ($main.find(".task").length === 0) {
            $main.append(`
                <p class="empty">
                    <i class="fa-regular fa-face-frown"></i>
                    Нажаль, задач немає
                </p>
            `);
        }
    }

    // ---------------- CREATE TASK ----------------

    function createTaskHTML(t) {

        let list = "";
        t.items.forEach(i => {
            list += `
                <li>
                    <input type="checkbox" ${i.checked ? "checked" : ""}>
                    <span>${i.text}</span>
                </li>
            `;
        });

        return `
        <div class="task ${t.pinned ? 'pinned' : ''}" data-id="${t.id}">

            <h3>${t.title}</h3>

            <small class="date">
                <i class="fa-regular fa-clock"></i>
                ${t.date}
            </small>

            <ul class="checklist">${list}</ul>

            ${t.image ? `<img src="${t.image}">` : ""}

            <button class="delete"><i class="fa-solid fa-trash"></i> Видалити</button>
            <button class="archive"><i class="fa-solid fa-box-archive"></i> Архів</button>
            <button class="edit"><i class="fa-solid fa-pen-to-square"></i> Редагувати</button>
            <button class="pin"><i class="fa-solid fa-thumbtack"></i> ${t.pinned ? "Відкріпити" : "Закріпити"}</button>

        </div>`;
    }

    // ---------------- ARCHIVE ----------------

    function createArchiveHTML(t) {
        return `
        <div class="archive-item" data-id="${t.id}">
            <span><i class="fa-solid fa-file-lines"></i> ${t.title}</span>

            <div>
                <button class="restore"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="delete-archive"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }

    // ---------------- ADD TASK ----------------

    $(".sidebar button:first").click(function () {

        const title = $title.val().trim();
        if (!title) return;

        const date = new Date().toLocaleString("uk-UA");

        const items = [];
        $text.val().split("\n").forEach(i => {
            if (i.trim()) {
                items.push({ text: i.trim(), checked: false });
            }
        });

        const file = $file[0].files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {

                addTask(title, date, items, e.target.result);

            };

            reader.readAsDataURL(file);

        } else {
            addTask(title, date, items, null);
        }

        $title.val("");
        $text.val("");
        $file.val("");
    });

    function addTask(title, date, items, image) {

        const task = {
            id: Date.now(),
            title,
            date,
            items,
            image,
            archived: false,
            pinned: false
        };

        tasks.push(task);

        save();
        render();

        alertify.success("➕ Задачу додано");
    }

    // ---------------- DELETE ----------------

    $(document).on("click", ".delete", function () {
        const id = $(this).closest(".task").data("id");
        tasks = tasks.filter(t => t.id !== id);

        save();
        render();

        alertify.error("🗑️ Видалено");
    });

    // ---------------- ARCHIVE ----------------

    $(document).on("click", ".archive", function () {
        const id = $(this).closest(".task").data("id");

        const task = tasks.find(t => t.id === id);
        task.archived = true;

        save();
        render();

        alertify.message("📦 В архіві");
    });

    $(document).on("click", ".restore", function () {
        const id = $(this).closest(".archive-item").data("id");

        const task = tasks.find(t => t.id === id);
        task.archived = false;

        save();
        render();

        alertify.success("↩ Відновлено");
    });

    $(document).on("click", ".delete-archive", function () {
        const id = $(this).closest(".archive-item").data("id");

        tasks = tasks.filter(t => t.id !== id);

        save();
        render();

        alertify.error("❌ Видалено назавжди");
    });

   // ---------------- PIN ----------------

$(document).on("click", ".pin", function () {

    const id = $(this).closest(".task").data("id");
    const task = tasks.find(t => t.id === id);

    task.pinned = !task.pinned;

    save();
    render();

    alertify.message(task.pinned ? "📌 Закріплено" : "📌 Відкріплено");
});

    // ---------------- CHECKBOX ----------------

    $(document).on("change", ".checklist input", function () {
        const taskId = $(this).closest(".task").data("id");
        const text = $(this).siblings("span").text();

        const task = tasks.find(t => t.id === taskId);

        const item = task.items.find(i => i.text === text);
        item.checked = $(this).is(":checked");

        save();
    });

    // ---------------- EDIT ----------------

    $(document).on("click", ".edit", function () {

        currentEditId = $(this).closest(".task").data("id");
    
        const task = tasks.find(t => t.id === currentEditId);
    
        $(".edit-title").val(task.title);
    
        let text = "";
        task.items.forEach(i => {
            text += i.text + "\n";
        });
    
        $(".edit-text").val(text);
    
        $(".edit-modal").addClass("active");
    });
    
    
    $(".close-edit").click(function () {
        $(".edit-modal").removeClass("active");
    });
    
    
    $(".save-edit").click(function () {
    
        const task = tasks.find(t => t.id === currentEditId);
    
        task.title = $(".edit-title").val();
    
        const newItems = [];
    
        $(".edit-text").val().split("\n").forEach(i => {
            if (i.trim()) {
                newItems.push({ text: i.trim(), checked: false });
            }
        });
    
        task.items = newItems;
    
        save();
        render();
    
        $(".edit-modal").removeClass("active");
    
        alertify.success("✏️ Оновлено");
    });

    // ---------------- SEARCH ----------------

    $search.on("input", function () {

        const val = $(this).val().toLowerCase();

        $(".task").each(function () {

            const title = $(this).find("h3").text().toLowerCase();
            const text = $(this).find(".checklist").text().toLowerCase();

            $(this).toggle(title.includes(val) || text.includes(val));
        });
    });

    // ---------------- SIDEBAR ----------------

    $(".menu-btn").click(function () {
        $(".sidebar").toggleClass("closed");
    });

    $(".open-archive").click(function () {
        $(".archive-panel").slideToggle(200);
    });

    // ---------------- INIT ----------------

    load();
    render();
});