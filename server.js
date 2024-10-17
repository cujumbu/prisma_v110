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

// New endpoint to handle both claims and returns
app.get('/api/cases', async (req, res) => {
  try {
    const { orderNumber, email } = req.query;

    // Check for claim
    const claim = await prisma.claim.findFirst({
      where: { orderNumber, email }
    });

    if (claim) {
      return res.json({ ...claim, type: 'claim' });
    }

    // Check for return
    const returnItem = await prisma.return.findFirst({
      where: { orderNumber, email }
    });

    if (returnItem) {
      return res.json({ ...returnItem, type: 'return' });
    }

    // If neither claim nor return is found
    res.status(404).json({ error: 'No case found' });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'An error occurred while fetching the case' });
  }
});

app.get('/api/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check for claim
    const claim = await prisma.claim.findUnique({
      where: { id }
    });

    if (claim) {
      return res.json({ ...claim, type: 'claim' });
    }

    // Check for return
    const returnItem = await prisma.return.findUnique({
      where: { id }
    });

    if (returnItem) {
      return res.json({ ...returnItem, type: 'return' });
    }

    // If neither claim nor return is found
    res.status(404).json({ error: 'Case not found' });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'An error occurred while fetching the case' });
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
