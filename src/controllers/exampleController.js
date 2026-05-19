const supabase = require("../db/supabase");

// GET all items
const getAll = async (req, res) => {
  const { data, error } = await supabase.from("items").select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
// GET single item by ID
const getOne = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Item not found" });
  res.json(data);
};

// POST - create new item
const create = async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "name is required" });

  const { data, error } = await supabase
    .from("items")
    .insert([{ name, description }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// PATCH - update item
const update = async (req, res) => {
  const { id } = req.params;
  const fields = req.body; // pass only the fields you want to update

  const { data, error } = await supabase
    .from("items")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// DELETE item
const remove = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Deleted successfully" });
};

module.exports = { getAll, getOne, create, update, remove };
