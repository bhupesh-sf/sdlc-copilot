// @ts-nocheck
const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../supabaseClient');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    // Insert user
    const { error } = await supabase
      .from('users')
      .insert({ email, password_hash });
    if (error) throw error;
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    // Fetch user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Compare password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // (For hackathon: return user info, in real app return JWT)
    return res.status(200).json({ message: 'Login successful.', user: { id: user.id, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

module.exports = router;
