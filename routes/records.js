const express = require("express");
const router = express.Router();
const db = require("../db");

const allowedStatuses = [
    "Pending",
    "In progress",
    "Completed"
];

// Validate record information
function validateRecord(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "A valid JSON object is required." };
    }

    const fields = [
        "title",
        "category",
        "description",
        "status"
    ];

    const record = {};

    for (const field of fields) {
        if (typeof body[field] !== "string") {
            return { error: field + " must be a text value." };
        }

        record[field] = body[field].trim();

        if (record[field] === "") {
            return { error: field + " is required." };
        }
    }

    if (record.title.length < 3 || record.title.length > 80) {
        return { error: "Title must have 3 to 80 characters." };
    }

    if (record.category.length < 2 || record.category.length > 40) {
        return { error: "Category must have 2 to 40 characters." };
    }

    if (record.description.length < 5 || record.description.length > 300) {
        return { error: "Description must have 5 to 300 characters." };
    }

    if (!allowedStatuses.includes(record.status)) {
        return {
            error: "Status must be Pending, In progress or Completed."
        };
    }

    return { record };
}

// Validate ID
function validId(value) {
    const id = Number(value);

    if (Number.isSafeInteger(id) && id > 0) {
        return id;
    }

    return null;
}

// GET all records
router.get("/", (req, res) => {
    try {
        const records = db.prepare(
            "SELECT * FROM records ORDER BY id"
        ).all();

        res.status(200).json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to retrieve records."
        });
    }
});

// GET one record
router.get("/:id", (req, res) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const record = db.prepare(
            "SELECT * FROM records WHERE id = ?"
        ).get(id);

        if (!record) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to retrieve record."
        });
    }
});

// POST - Create a record
router.post("/", (req, res) => {
    try {
        const result = validateRecord(req.body);

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        const {
            title,
            category,
            description,
            status
        } = result.record;

        const insert = db.prepare(`
            INSERT INTO records
            (title, category, description, status)
            VALUES (?, ?, ?, ?)
        `);

        const saved = insert.run(
            title,
            category,
            description,
            status
        );

        const record = db.prepare(
            "SELECT * FROM records WHERE id = ?"
        ).get(saved.lastInsertRowid);

        res.status(201).json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to create record."
        });
    }
});

// PUT - Update a record
router.put("/:id", (req, res) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const result = validateRecord(req.body);

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        const existing = db.prepare(
            "SELECT * FROM records WHERE id = ?"
        ).get(id);

        if (!existing) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        const {
            title,
            category,
            description,
            status
        } = result.record;

        db.prepare(`
            UPDATE records
            SET title = ?,
                category = ?,
                description = ?,
                status = ?
            WHERE id = ?
        `).run(
            title,
            category,
            description,
            status,
            id
        );

        const updated = db.prepare(
            "SELECT * FROM records WHERE id = ?"
        ).get(id);

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update record."
        });
    }
});

// DELETE a record
router.delete("/:id", (req, res) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const result = db.prepare(
            "DELETE FROM records WHERE id = ?"
        ).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json({
            message: "Record deleted successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to delete record."
        });
    }
});

module.exports = router;