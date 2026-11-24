const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
        category TEXT NOT NULL CHECK(length(category) BETWEEN 2 AND 40),
        description TEXT NOT NULL CHECK(length(description) BETWEEN 5 AND 300),
        status TEXT NOT NULL CHECK(status IN ('Pending', 'In progress', 'Completed'))
    );
`);

// Insert sample records only if the database is empty
const count = db.prepare("SELECT COUNT(*) AS total FROM records").get();

if (count.total === 0) {
    const insert = db.prepare(`
        INSERT INTO records (title, category, description, status)
        VALUES (?, ?, ?, ?)
    `);

    const sampleRecords = [
        ["Computer cannot connect to Wi-Fi", "Network", "The computer cannot connect to campus Wi-Fi.", "Pending"],
        ["Printer not responding", "Hardware", "The office printer is not responding.", "In progress"],
        ["Password reset request", "Account", "A student needs help resetting their password.", "Completed"],
        ["Computer running slowly", "Hardware", "The computer takes too long to open applications.", "Pending"],
        ["Software installation request", "Software", "A student needs approved software installed.", "In progress"],
        ["Email login problem", "Account", "A user cannot log into their university email.", "Completed"],
        ["Keyboard not working", "Hardware", "The computer keyboard is not responding.", "Pending"],
        ["Internet connection issue", "Network", "The internet connection keeps disconnecting.", "In progress"]
    ];

    const seed = db.transaction((records) => {
        for (const record of records) {
            insert.run(...record);
        }
    });

    seed(sampleRecords);
}

module.exports = db;