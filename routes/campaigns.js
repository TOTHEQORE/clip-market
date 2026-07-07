const express = require('express');
const router = express.Router();
const { load, save } = require('../lib/store');
const { requireAuth, requireRole } = require('../middleware/auth');

function computeSpent(db, campaignId) {
  return db.submissions
  .filter(s => s.campaignId === campaignId && s.status === 'approved')
  .reduce((sum, s) => sum + (s.payout || 0), 0);
}

router.get('/', (req, res) => {
  const db = load();
  const campaigns = db.campaigns.map(c => ({ ...c, spent: computeSpent(db, c.id) }));
  res.json({ campaigns });
});

router.get('/:id', (req, res) => {
  const db = load();
  const campaign = db.campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ campaign: { ...campaign, spent: computeSpent(db, campaign.id) } });
});

router.post('/', requireAuth, requireRole('brand'), (req, res) => {
  const { title, brief, budget, cpm, requirements } = req.body || {};
  if (!title || !brief || !budget || !cpm) {
    return res.status(400).json({ error: 'title, brief, budget and cpm are required' });
  }
  const db = load();
  const campaign = {
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    brandId: req.user.id,
    brandName: req.user.name,
    title,
    brief,
    requirements: requirements || '',
    budget: Number(budget),
    cpm: Number(cpm),
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.campaigns.push(campaign);
  save(db);
  res.status(201).json({ campaign });
});

module.exports = router;
