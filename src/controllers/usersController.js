const supabase = require("../db/supabase");

const getAll = async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const register = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email)
    return res.status(400).json({ error: "name and email are required" });

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing)
    return res.status(409).json({ error: "Email already registered" });

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "User deleted" });
};

module.exports = { getAll, register, remove };