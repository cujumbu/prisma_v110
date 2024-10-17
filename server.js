import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendClaimSubmissionEmail, sendClaimStatusUpdateEmail } from './src/services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.post('/api/claims', async (req, res) => {
  try {
    const newClaim = await prisma.claim.create({
      data: {
        ...req.body,
        status: 'Pending'
      }
    });
    await sendClaimSubmissionEmail(newClaim.email, newClaim);
    res.status(201).json(newClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'An error occurred while creating the claim' });
  }
});

app.get('/api/claims', async (req, res) => {
  try {
    const claims = await prisma.claim.findMany();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'An error occurred while fetching claims' });
  }
});

app.get('/api/claims/:id', async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id }
    });
    if (claim) {
      res.json(claim);
    } else {
      res.status(404).json({ error: 'Claim not found' });
    }
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'An error occurred while fetching the claim' });
  }
});

app.patch('/api/claims/:id', async (req, res) => {
  try {
    const updatedClaim = await prisma.claim.update({
      where: { id: req.params.id },
      data: req.body
    });
    await sendClaimStatusUpdateEmail(updatedClaim.email, updatedClaim);
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'An error occurred while updating the claim' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

app.post('/api/admin/create', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: true
      }
    });
    res.status(201).json({ id: newAdmin.id, email: newAdmin.email, isAdmin: newAdmin.isAdmin });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'An error occurred while creating the admin user' });
  }
});

app.get('/api/brands', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'An error occurred while fetching brands' });
  }
});

app.get('/api/users/check', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ exists: userCount > 0 });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'Failed to check user existence' });
  }
});

// New routes for returns
app.post('/api/returns', async (req, res) => {
  try {
    const newReturn = await prisma.return.create({
      data: {
        ...req.body,
        status: 'Pending'
      }
    });
    res.status(201).json(newReturn);
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({ error: 'An error occurred while creating the return' });
  }
});

app.get('/api/returns', async (req, res) => {
  try {
    const returns = await prisma.return.findMany();
    res.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'An error occurred while fetching returns' });
  }
});

app.get('/api/returns/:id', async (req, res) => {
  try {
    const returnItem = await prisma.return.findUnique({
      where: { id: req.params.id }
    });
    if (returnItem) {
      res.json(returnItem);
    } else {
      res.status(404).json({ error: 'Return not found' });
    }
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({ error: 'An error occurred while fetching the return' });
  }
});

app.patch('/api/returns/:id', async (req, res) => {
  try {
    const updatedReturn = await prisma.return.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updatedReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(500).json({ error: 'An error occurred while updating the return' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});