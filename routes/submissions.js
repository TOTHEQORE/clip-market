const express = require('express');
const router = express.Router();
const { load, save } = require('../lib/store');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/', requireAuth, requireRole('creator'), (req, res) => {
  const { campaignId, clipUrl } = req.body || {};
  if (!campaignId || !clipUrl) {
    return res.status(400).json({ error: 'campaignId and clipUrl are required' });
  }
  const db = load();
  const campaign = db.campaigns.find(c => c.id === campaignId);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const submission = {
    id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    campaignId,
    creatorId: req.user.id,
    creatorName: req.user.name,
    clipUrl,
    views: 0,
    status: 'pending',
    payout: 0,
    createdAt: new Date().toISOString()
  };
  db.submissions.push(submission);
  save(db);
  res.status(201).json({ submission });
});

router.get('/mine', requireAuth, requireRole('creator'), (req, res) => {
  const db = load();
  const mine = db.submissions.filter(s => s.creatorId === req.user.id);
  const totalEarnings = mine.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.payout, 0);
  res.json({ submissions: mine, totalEarnings });
});

router.get('/campaign/:campaignId', requireAuth, requireRole('brand'), (req, res) => {
  const db = load();
  const campaign = db.campaigns.find(c => c.id === req.params.campaignId);
  if (!campaign || campaign.brandId !== req.user.id) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  const submissions = db.submissions.filter(s => s.campaignId === req.params.campaignId);
  res.json({ submissions });
});

router.patch('/:id', requireAuth, requireRole('brand'), (req, res) => {
  const { views, status } = req.body || {};
  const db = load();
  const submission = db.submissions.find(s => s.id === req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  const campaign = db.campaigns.find(c => c.id === submission.campaignId);
  if (!campaign || campaign.brandId !== req.user.id) {
    return res.status(403).json({ error: 'Not your campaign' });
  }
  if (typeof views === 'number') {
    submission.views = views;
    submission.payout = Math.round((views / 1000) * campaign.cpm * 100) / 100;
  }
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    submission.status = status;
    if (status === 'approved') {
      const creator = db.users.find(u => u.id === submission.creatorId);
      if (creator) {
        creator.balance = (creator.balance || 0) + submission.payout;
      }
    }
  }
  save(db);
  res.json({ submission });
});

module.exports = router;
